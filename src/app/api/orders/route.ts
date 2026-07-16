import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { generateUniqueOrderReference } from "@/lib/queries/orders";
import { sendOrderConfirmation } from "@/lib/email";
import {
  clientIp,
  rateLimit,
  recallRecent,
  rememberRecent,
} from "@/lib/rate-limit";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_QTY = 100_000;

export async function POST(request: NextRequest) {
  // Best-effort abuse throttle for this unauthenticated endpoint.
  const ip = clientIp(request.headers);
  const limit = rateLimit(`orders:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const supabase = await createServerSupabaseClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const {
    customer_name,
    company_name,
    email,
    phone,
    country,
    delivery_address,
    notes,
    proposed_shipment_date,
    consignee_name,
    consignee_phone,
    consignee_address,
    groups,
    price_list_id,
    client_id,
    // Honeypot: a hidden field real users never fill. Bots that autofill it get
    // a success-shaped response but nothing is created or emailed.
    website,
  } = body as Record<string, string> & {
    groups?: { name?: string; items?: { quantity?: unknown; unit_price?: unknown }[] }[];
  };

  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ success: true });
  }

  if (!customer_name || !email || !groups?.length) {
    return NextResponse.json(
      { error: "Please provide your name, email, and at least one item before submitting." },
      { status: 400 },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Server-side bounds — the browser guards these, the public API must too.
  for (const g of groups) {
    for (const it of g.items ?? []) {
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q < 1 || q > MAX_QTY) {
        return NextResponse.json(
          { error: "Each item must have a whole quantity between 1 and 100,000." },
          { status: 400 },
        );
      }
      if (it.unit_price != null) {
        const p = Number(it.unit_price);
        if (!Number.isFinite(p) || p < 0) {
          return NextResponse.json(
            { error: "Item prices must be valid, non-negative numbers." },
            { status: 400 },
          );
        }
      }
    }
  }

  const admin = await createAdminSupabaseClient();

  // Idempotency: an identical submission (same email + items) within the window
  // returns the original reference instead of creating a duplicate order/email.
  const dedupKey =
    "order:" +
    createHash("sha1")
      .update(String(email).toLowerCase() + JSON.stringify(groups))
      .digest("hex");
  const priorRef = recallRecent(dedupKey);
  if (priorRef) {
    return NextResponse.json({ success: true, order_reference: priorRef, deduped: true });
  }

  let order_reference = await generateUniqueOrderReference(admin);

  // Insert order
  // Append shipment/consignee info to notes for storage
  let storedNotes = notes || "";
  if (proposed_shipment_date)
    storedNotes += `\n\nProposed Shipment: ${proposed_shipment_date}`;
  if (consignee_name) storedNotes += `\nConsignee: ${consignee_name}`;
  if (consignee_phone) storedNotes += `\nConsignee Phone: ${consignee_phone}`;
  if (consignee_address) storedNotes += `\nConsignee Address: ${consignee_address}`;

  let order: { id: string } | null = null;
  let orderError: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await supabase
      .from("orders")
      .insert({
        order_reference,
        customer_name,
        company_name: company_name || null,
        email,
        phone: phone || null,
        country: country || null,
        delivery_address: delivery_address || null,
        notes: storedNotes || null,
        status: "submitted",
        client_id: client_id || null,
        price_list_id: price_list_id || null,
        submitted_at: new Date().toISOString(),
      })
      .select()
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
    return NextResponse.json(
      { error: "We couldn't submit your order just now. Please try again, or contact us if it keeps happening." },
      { status: 500 },
    );
  }
  const orderId = order.id;

  // Supabase has no client-side transactions, so if any group/item insert
  // fails we roll back the partially-created order. The admin client is used
  // for cleanup so row-level security can't block the deletion.
  async function rollbackOrder() {
    const { data: createdGroups } = await admin
      .from("order_groups")
      .select("id")
      .eq("order_id", orderId);
    const groupIds = (createdGroups ?? []).map((g) => g.id);
    if (groupIds.length) {
      await admin.from("order_items").delete().in("order_group_id", groupIds);
    }
    await admin.from("order_groups").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  }

  // Insert groups and items
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const { data: groupData, error: groupError } = await supabase
      .from("order_groups")
      .insert({
        order_id: orderId,
        group_name: group.name || `Order ${String.fromCharCode(65 + i)}`,
        sort_order: i,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Order group insert failed:", groupError.message);
      await rollbackOrder();
      return NextResponse.json(
        { error: "We couldn't submit your order just now. Please try again, or contact us if it keeps happening." },
        { status: 500 },
      );
    }

    if (group.items?.length) {
      // Resolve species slugs to UUIDs
      const slugs = group.items
        .map((item: { species_id: string }) => item.species_id)
        .filter(
          (id: string) =>
            id &&
            !id.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            ),
        );

      let slugToUuid: Record<string, string> = {};
      if (slugs.length > 0) {
        const { data: speciesRows } = await supabase
          .from("species")
          .select("id, slug")
          .in("slug", slugs);
        if (speciesRows) {
          slugToUuid = Object.fromEntries(
            speciesRows.map((r: { id: string; slug: string }) => [
              r.slug,
              r.id,
            ]),
          );
        }
      }

      const items = group.items.map(
        (item: {
          species_id: string;
          species_name: string;
          scientific_name?: string;
          size?: string;
          quantity: number;
          unit_price?: number;
        }) => ({
          order_group_id: groupData.id,
          species_id: slugToUuid[item.species_id] || item.species_id,
          species_name: item.species_name,
          scientific_name: item.scientific_name || null,
          size: item.size || null,
          quantity: Number(item.quantity),
          // Preserve an explicit 0 price; only a nullish value becomes null.
          unit_price: item.unit_price == null ? null : Number(item.unit_price),
        }),
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) {
        console.error("Order items insert failed:", itemsError.message);
        await rollbackOrder();
        return NextResponse.json(
          { error: "We couldn't submit your order just now. Please try again, or contact us if it keeps happening." },
          { status: 500 },
        );
      }
    }
  }

  // Send email notifications including shipment/consignee info.
  // Await in serverless environments so the lambda does not exit before delivery.
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
    groups: groups.map(
      (g: {
        name: string;
        items: {
          species_name: string;
          scientific_name?: string;
          size?: string;
          quantity: number;
          unit_price?: number;
        }[];
      }) => ({
        name: g.name,
        items: g.items,
      }),
    ),
  }).catch((err) => {
    console.error("Order email failed:", err);
  });

  // Remember this submission so an immediate retry returns the same reference
  // instead of creating a duplicate order.
  rememberRecent(dedupKey, order_reference, 60_000);

  return NextResponse.json({
    success: true,
    order_reference,
    order_id: orderId,
  });
}
