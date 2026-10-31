import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { client_id, title, valid_from, valid_until, items } = body;

  if (!client_id || !title || !items?.length) {
    return NextResponse.json(
      { error: "A client, a title, and at least one priced item are required." },
      { status: 400 },
    );
  }

  if (typeof title !== "string" || !title.trim())
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (valid_from && valid_until && String(valid_until) < String(valid_from))
    return NextResponse.json(
      { error: "The end date must be on or after the start date." },
      { status: 400 },
    );

  // Collapse to one row per species — the list allows a single price per
  // species (unique price_list_id+species_id), but uploads/templates can carry
  // the same species across multiple size rows. Keep the first occurrence,
  // and keep the admin's row order as the list order.
  const seenSpecies = new Set<string>();
  const cleanItems: { species_id: string; custom_price: number; sort_order: number }[] = [];
  for (const item of items as { species_id?: unknown; custom_price?: unknown }[]) {
    if (typeof item?.species_id !== "string" || !item.species_id) continue;
    if (seenSpecies.has(item.species_id)) continue;
    const price = Number(item.custom_price);
    if (!Number.isFinite(price) || price <= 0 || price >= 1e8)
      return NextResponse.json(
        { error: "Every price must be a number greater than 0." },
        { status: 400 },
      );
    seenSpecies.add(item.species_id);
    cleanItems.push({
      species_id: item.species_id,
      custom_price: Math.round(price * 100) / 100,
      sort_order: cleanItems.length,
    });
  }
  if (cleanItems.length === 0)
    return NextResponse.json(
      { error: "Add at least one species with a price." },
      { status: 400 },
    );

  // The slug is the public URL and is UNIQUE, so two lists can't share one
  // (e.g. "2026 Price List" for two clients). Suffix it with random chars —
  // the URL is token-gated anyway, so readability is all the base buys.
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || "price-list";
  const token = crypto.randomBytes(24).toString("hex");

  const admin = await createAdminSupabaseClient();

  // Create the price list (retry on the rare slug collision)
  let priceList: { id: string } & Record<string, unknown> = { id: "" };
  let slug = "";
  for (let attempt = 0; ; attempt++) {
    slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
    const { data, error: plError } = await admin
      .from("client_price_lists")
      .insert({
        client_id,
        slug,
        access_token: token,
        title: title.trim(),
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        active: true,
      })
      .select()
      .single();
    if (!plError) {
      priceList = data;
      break;
    }
    if (plError.code === "23505" && attempt < 3) continue;
    console.error("Price list create failed:", plError.message);
    return NextResponse.json(
      {
        error:
          plError.code === "23503"
            ? "That client no longer exists."
            : "Couldn't create the price list. Please try again.",
      },
      { status: 400 },
    );
  }

  const { error: itemsError } = await admin
    .from("client_price_items")
    .insert(cleanItems.map((i) => ({ ...i, price_list_id: priceList.id })));

  if (itemsError) {
    // Clean up the price list if items failed
    console.error("Price list items insert failed:", itemsError.message);
    await admin.from("client_price_lists").delete().eq("id", priceList.id);
    return NextResponse.json(
      {
        error:
          itemsError.code === "23503"
            ? "One of the species no longer exists. Refresh the page and try again."
            : "Couldn't save the price list items. Please try again.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ...priceList, token });
}
