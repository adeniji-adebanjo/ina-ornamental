import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { client_id, title, valid_from, valid_until, items } = body;

  if (!client_id || !title || !items?.length) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Generate slug and token
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const token = crypto.randomBytes(24).toString("hex");

  // Create the price list
  const { data: priceList, error: plError } = await supabase
    .from("client_price_lists")
    .insert({
      client_id,
      slug,
      token,
      title,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      is_active: true,
    })
    .select()
    .single();

  if (plError) {
    return NextResponse.json({ error: plError.message }, { status: 400 });
  }

  // Insert price items
  const priceItems = items.map(
    (item: { species_id: string; custom_price: number }) => ({
      price_list_id: priceList.id,
      species_id: item.species_id,
      custom_price: item.custom_price,
    }),
  );

  const { error: itemsError } = await supabase
    .from("client_price_items")
    .insert(priceItems);

  if (itemsError) {
    // Clean up the price list if items failed
    await supabase.from("client_price_lists").delete().eq("id", priceList.id);
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ ...priceList, token });
}
