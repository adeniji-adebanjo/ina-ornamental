import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { generateUniqueOrderReference } from "@/lib/queries/orders";
import { getOrderablePriceList } from "@/lib/queries/client-pricing";
import { sendOrderConfirmation } from "@/lib/email";
import {
  clientIp,
  rateLimit,
  claimOnce,
  forgetRecent,
  rememberRecent,
} from "@/lib/rate-limit";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_QTY = 100_000;
const MAX_GROUPS = 20;
const MAX_LINES = 500;
const DEDUP_TTL_MS = 60_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERIC_FAILURE =
  "We couldn't submit your order just now. Please try again, or contact us if it keeps happening.";

function tooMany(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    },
  );
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

// Trimmed string capped at `max` chars, or "" for anything that isn't a string.
function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

interface ResolvedLine {
  species_id: string;
  species_name: string;
  scientific_name: string | null;
  size: string | null;
  quantity: number;
  qty_per_box: number;
  unit_price: number | null;
}

export async function POST(request: NextRequest) {
  // Throttle this unauthenticated endpoint: a burst limit, plus an hourly cap
  // because each accepted order sends email to an address the caller chooses.
  const ip = clientIp(request.headers);
  for (const [key, opts] of [
    [`orders:${ip}`, { limit: 6, windowMs: 60_000 }],
    [`orders-hour:${ip}`, { limit: 20, windowMs: 3_600_000 }],
  ] as const) {
    const limit = rateLimit(key, opts);
    if (!limit.ok) return tooMany(limit.retryAfterMs);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: a hidden field real users never fill. Bots that autofill it get
  // a success-shaped response but nothing is created or emailed.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  const customer_name = str(body.customer_name, 200);
  const company_name = str(body.company_name, 200);
  const email = str(body.email, 254).toLowerCase();
  const phone = str(body.phone, 50);
  const country = str(body.country, 100);
  const delivery_address = str(body.delivery_address, 1000);
  const notes = str(body.notes, 5000);
  const proposed_shipment_date = str(body.proposed_shipment_date, 50);
  const consignee_name = str(body.consignee_name, 200);
  const consignee_phone = str(body.consignee_phone, 50);
  const consignee_address = str(body.consignee_address, 1000);
  const slug = str(body.slug, 200);
  const token = str(body.token, 200);

  const rawGroups = Array.isArray(body.groups)
    ? (body.groups as { name?: unknown; items?: unknown }[])
    : [];
  const groups = rawGroups
    .map((g, i) => ({
      name: str(g?.name, 100) || `Order ${String.fromCharCode(65 + i)}`,
      items: Array.isArray(g?.items)
        ? (g.items as Record<string, unknown>[])
        : [],
    }))
    .filter((g) => g.items.length > 0);

  if (!customer_name || !email || groups.length === 0) {
    return bad(
      "Please provide your name, email, and at least one item before submitting.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("Please enter a valid email address.");
  }
  const lineCount = groups.reduce((n, g) => n + g.items.length, 0);
  if (groups.length > MAX_GROUPS || lineCount > MAX_LINES) {
    return bad(
      `Orders are limited to ${MAX_GROUPS} groups and ${MAX_LINES} lines. Please split it into several orders.`,
    );
  }
  for (const g of groups) {
    for (const it of g.items) {
      const q = Number(it?.quantity);
      if (!Number.isInteger(q) || q < 1 || q > MAX_QTY) {
        return bad("Each item must have a whole quantity between 1 and 100,000.");
      }
    }
  }

  // Per-recipient cap so the endpoint can't be used to flood one inbox.
  const perEmail = rateLimit(`orders-email:${email}`, {
    limit: 5,
    windowMs: 3_600_000,
  });
  if (!perEmail.ok) return tooMany(perEmail.retryAfterMs);

  const admin = await createAdminSupabaseClient();

  // ── Resolve every line against the database ──────────────────────────────
  // Prices, names and the client are never taken from the browser: a priced
  // order must come through a live price-list link, and each line is priced
  // from that list.
  let priceListId: string | null = null;
  let clientId: string | null = null;
  const resolved: { name: string; lines: ResolvedLine[] }[] = [];
  const problems: string[] = [];

  if (slug || token) {
    let list;
    try {
      list = await getOrderablePriceList(slug, token);
    } catch (err) {
      console.error("Price list lookup failed:", err);
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 500 });
    }
    if (!list) {
      return NextResponse.json(
        {
          error:
            "This price list link is no longer active. Please contact us for an updated link.",
        },
        { status: 410 },
      );
    }
    priceListId = list.id;
    clientId = list.client_id;

    for (const g of groups) {
      const lines: ResolvedLine[] = [];
      for (const it of g.items) {
        const id = str(it.species_id, 100);
        const entry = list.items.get(id);
        if (!entry) {
          problems.push(str(it.species_name, 100) || "an item");
          continue;
        }
        if (entry.availability === "out_of_stock") {
          problems.push(`${entry.species_name} (currently unavailable)`);
          continue;
        }
        lines.push({
          species_id: entry.species_id,
          species_name: entry.species_name,
          scientific_name: entry.scientific_name,
          size: entry.sizes.length ? entry.sizes.join(", ") : null,
          quantity: Number(it.quantity),
          qty_per_box: entry.qty_per_box,
          unit_price: entry.unit_price,
        });
      }
      resolved.push({ name: g.name, lines });
    }
  } else {
    // Catalogue quote request: no prices. The cart identifies species by
    // slug (or id); look them all up in one query.
    const refs = [
      ...new Set(
        groups.flatMap((g) => g.items.map((it) => str(it.species_id, 200))),
      ),
    ].filter(Boolean);
    const ids = refs.filter((r) => UUID_RE.test(r));
    const slugs = refs.filter((r) => !UUID_RE.test(r));
    const filters = [
      ids.length ? `id.in.(${ids.join(",")})` : null,
      slugs.length
        ? `slug.in.(${slugs.map((s) => `"${s.replace(/["\\]/g, "")}"`).join(",")})`
        : null,
    ].filter(Boolean);

    type SpeciesRow = {
      id: string;
      slug: string;
      common_name: string;
      scientific_name: string | null;
      sizes: string[] | null;
      qty_per_box: number | null;
      availability: string | null;
    };
    let rows: SpeciesRow[] = [];
    if (filters.length) {
      const { data, error } = await admin
        .from("species")
        .select(
          "id, slug, common_name, scientific_name, sizes, qty_per_box, availability",
        )
        .or(filters.join(","));
      if (error) {
        console.error("Species lookup failed:", error.message);
        return NextResponse.json({ error: GENERIC_FAILURE }, { status: 500 });
      }
      rows = data ?? [];
    }
    const byRef = new Map<string, SpeciesRow>();
    for (const r of rows) {
      byRef.set(r.id, r);
      byRef.set(r.slug, r);
    }

    for (const g of groups) {
      const lines: ResolvedLine[] = [];
      for (const it of g.items) {
        const sp = byRef.get(str(it.species_id, 200));
        if (!sp) {
          problems.push(str(it.species_name, 100) || "an item");
          continue;
        }
        if (sp.availability === "out_of_stock") {
          problems.push(`${sp.common_name} (currently unavailable)`);
          continue;
        }
        // Keep the customer's size only if it's one this species comes in.
        const wanted = str(it.size, 100).toLowerCase();
        const size =
          (sp.sizes ?? []).find((s) => s.toLowerCase() === wanted) ?? null;
        lines.push({
          species_id: sp.id,
          species_name: sp.common_name,
          scientific_name: sp.scientific_name,
          size,
          quantity: Number(it.quantity),
          qty_per_box: sp.qty_per_box ?? 1,
          unit_price: null,
        });
      }
      resolved.push({ name: g.name, lines });
    }
  }

  if (problems.length) {
    return bad(
      `Some items can't be ordered: ${problems.slice(0, 5).join(", ")}${problems.length > 5 ? ` and ${problems.length - 5} more` : ""}. Please remove them and try again.`,
    );
  }

  // ── Idempotency ───────────────────────────────────────────────────────────
  // Claimed BEFORE writing, so a double-click or a retried request that
  // arrives while the first is still running can't create a second order.
  const dedupKey =
    "order:" +
    createHash("sha1")
      .update(
        JSON.stringify([
          email,
          priceListId,
          resolved.map((g) =>
            g.lines.map((l) => [l.species_id, l.size, l.quantity]),
          ),
        ]),
      )
      .digest("hex");
  const claim = claimOnce(dedupKey, DEDUP_TTL_MS);
  if (claim.state === "done") {
    return NextResponse.json({
      success: true,
      order_reference: claim.value,
      deduped: true,
    });
  }
  if (claim.state === "pending") {
    return NextResponse.json(
      {
        error:
          "This order is already being submitted. Please wait a few seconds before trying again.",
      },
      { status: 409 },
    );
  }

  // ── Write (service role; RLS has no public insert) ────────────────────────
  let storedNotes = notes;
  if (proposed_shipment_date)
    storedNotes += `\n\nProposed Shipment: ${proposed_shipment_date}`;
  if (consignee_name) storedNotes += `\nConsignee: ${consignee_name}`;
  if (consignee_phone) storedNotes += `\nConsignee Phone: ${consignee_phone}`;
  if (consignee_address)
    storedNotes += `\nConsignee Address: ${consignee_address}`;

  let order_reference = await generateUniqueOrderReference(admin);
  let order: { id: string } | null = null;
  let orderError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await admin
      .from("orders")
      .insert({
        order_reference,
        customer_name,
        company_name: company_name || null,
        email,
        phone: phone || null,
        country: country || null,
        delivery_address: delivery_address || null,
        notes: storedNotes.trim() || null,
        status: "submitted",
        client_id: clientId,
        price_list_id: priceListId,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    order = res.data;
    orderError = res.error;
    if (!orderError) break;
    // Unique-violation on order_reference — regenerate and retry.
    if (orderError.code === "23505") {
      order_reference = await generateUniqueOrderReference(admin);
      continue;
    }
    break;
  }

  if (orderError || !order) {
    console.error("Order insert failed:", orderError?.message);
    forgetRecent(dedupKey);
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 500 });
  }
  const orderId = order.id;

  // Supabase has no client-side transactions; deleting the order cascades to
  // its groups and items, so this undoes a partial write.
  async function failAndRollback(what: string, message: string) {
    console.error(`${what} insert failed:`, message);
    const { error } = await admin.from("orders").delete().eq("id", orderId);
    if (error) console.error(`Rollback of order ${orderId} failed:`, error.message);
    forgetRecent(dedupKey);
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 500 });
  }

  const { data: groupRows, error: groupError } = await admin
    .from("order_groups")
    .insert(
      resolved.map((g, i) => ({
        order_id: orderId,
        group_name: g.name,
        sort_order: i,
      })),
    )
    .select("id, sort_order");
  if (groupError || !groupRows || groupRows.length !== resolved.length) {
    return failAndRollback("Order group", groupError?.message ?? "row count mismatch");
  }
  const groupIdByIndex = new Map(groupRows.map((r) => [r.sort_order, r.id]));

  const itemRows = resolved.flatMap((g, i) =>
    g.lines.map((l) => ({
      order_group_id: groupIdByIndex.get(i)!,
      species_id: l.species_id,
      species_name: l.species_name,
      scientific_name: l.scientific_name,
      size: l.size,
      quantity: l.quantity,
      unit_price: l.unit_price,
    })),
  );
  const { error: itemsError } = await admin.from("order_items").insert(itemRows);
  if (itemsError) return failAndRollback("Order items", itemsError.message);

  // The order is saved; remember it before the (slow) email step so a retry
  // during sending gets this reference rather than a second order.
  rememberRecent(dedupKey, order_reference, DEDUP_TTL_MS);

  // Await so the response isn't sent before delivery is attempted. Failures
  // are logged inside; the order stands either way.
  await sendOrderConfirmation({
    order_reference,
    customer_name,
    company_name,
    email,
    phone,
    country,
    delivery_address,
    notes,
    proposed_shipment_date: proposed_shipment_date || null,
    consignee_name: consignee_name || null,
    consignee_phone: consignee_phone || null,
    consignee_address: consignee_address || null,
    groups: resolved.map((g) => ({
      name: g.name,
      items: g.lines.map((l) => ({
        species_name: l.species_name,
        scientific_name: l.scientific_name ?? undefined,
        size: l.size ?? undefined,
        quantity: l.quantity,
        qty_per_box: l.qty_per_box,
        unit_price: l.unit_price,
      })),
    })),
  }).catch((err) => {
    console.error(`Order email failed (${order_reference}):`, err);
  });

  return NextResponse.json({
    success: true,
    order_reference,
    order_id: orderId,
  });
}
