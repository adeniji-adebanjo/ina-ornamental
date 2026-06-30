import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Update the custom price of a single price-list item.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { itemId } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const price = Number(body.custom_price);
  if (!Number.isFinite(price) || price <= 0)
    return NextResponse.json(
      { error: "Enter a valid price greater than 0" },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("client_price_items")
    .update({ custom_price: price })
    .eq("id", itemId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// Remove a species from a price list.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { itemId } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { error } = await admin
    .from("client_price_items")
    .delete()
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
