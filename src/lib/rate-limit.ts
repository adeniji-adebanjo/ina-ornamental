// In-memory rate limiting + short-window request dedup.
//
// Production runs as a single long-lived `next start` process behind Nginx
// (deploy/), so this memory IS global for the site. Nginx `limit_req` sits in
// front as the coarse first line (deploy/nginx); this is the per-endpoint
// layer. If the app is ever run as several instances or on serverless, move
// these maps to a shared store (e.g. Redis).

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
const recent = new Map<string, { value: string; expiresAt: number }>();

// Sliding fixed-window limiter. Returns whether the call is allowed.
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    if (buckets.size > 5000) sweep(now);
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.count >= opts.limit) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

// Returns a stored value for `key` if it hasn't expired (used for idempotency:
// return the original result for a duplicate request within the window).
export function recallRecent(key: string): string | null {
  const now = Date.now();
  const hit = recent.get(key);
  if (hit && hit.expiresAt > now) return hit.value;
  return null;
}

export function rememberRecent(key: string, value: string, ttlMs: number): void {
  recent.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (recent.size > 5000) sweep(Date.now());
}

const PENDING = "\u0000pending";

/**
 * Claim `key` for a request that's about to do non-idempotent work. Returns
 * "new" (claimed — call rememberRecent on success or forgetRecent on failure),
 * "pending" (an identical request is still in flight) or the stored result.
 * Claiming before the work starts is what stops a double-click or a retried
 * request from creating a second order while the first is still running.
 */
export function claimOnce(
  key: string,
  ttlMs: number,
): { state: "new" } | { state: "pending" } | { state: "done"; value: string } {
  const hit = recallRecent(key);
  if (hit === PENDING) return { state: "pending" };
  if (hit !== null) return { state: "done", value: hit };
  rememberRecent(key, PENDING, ttlMs);
  return { state: "new" };
}

export function forgetRecent(key: string): void {
  recent.delete(key);
}

function sweep(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  for (const [k, r] of recent) if (r.expiresAt <= now) recent.delete(k);
}

// The client's IP as seen by our own proxy. Nginx overwrites X-Real-IP with
// $remote_addr, so a client can't forge it. The FIRST X-Forwarded-For entry is
// whatever the client sent (Nginx appends to it), so rotating it would dodge
// every limit; when X-Real-IP is absent use the LAST entry, the one our proxy
// added.
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1]!;
  }
  return "unknown";
}
