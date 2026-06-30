import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Add a species + custom price to an existing price list.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const price = Number(body.custom_price);
  if (!body.species_id)
    return NextResponse.json({ error: "Species is required" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0)
    return NextResponse.json(
      { error: "Enter a valid price greater than 0" },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();

  // Append to the end of the list.
  const { data: maxRow } = await admin
    .from("client_price_items")
    .select("sort_order")
    .eq("price_list_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await admin
    .from("client_price_items")
    .insert({
      price_list_id: id,
      species_id: body.species_id,
      custom_price: price,
      sort_order,
    })
    .select()
    .single();

  if (error) {
    // Unique (price_list_id, species_id) violation.
    if (error.code === "23505")
      return NextResponse.json(
        { error: "That species is already in this price list." },
        { status: 409 },
      );
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
