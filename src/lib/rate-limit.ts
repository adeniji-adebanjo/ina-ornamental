// Best-effort, in-memory rate limiting + short-window request dedup.
//
// NOTE: on serverless (per-instance memory) this is a MITIGATION, not a hard
// guarantee — it blunts scripted floods and accidental double-submits but is
// not a global limiter. For production-grade limits pair it with a CAPTCHA
// (Cloudflare Turnstile) and/or a durable store (e.g. Upstash Redis).

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

function sweep(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  for (const [k, r] of recent) if (r.expiresAt <= now) recent.delete(k);
}

// Extract a best-effort client IP from proxy headers.
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") || "unknown";
}
