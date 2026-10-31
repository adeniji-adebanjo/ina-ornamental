import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Update the custom price of a single price-list item.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const price = Number(body?.custom_price);
  if (!Number.isFinite(price) || price <= 0 || price >= 1e8)
    return NextResponse.json(
      { error: "Enter a valid price greater than 0" },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();
  // Scope by the list in the URL too, so an item id can only be edited
  // through the list it belongs to.
  const { data, error } = await admin
    .from("client_price_items")
    .update({ custom_price: Math.round(price * 100) / 100 })
    .eq("id", itemId)
    .eq("price_list_id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Price item update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update the price" }, { status: 400 });
  }
  if (!data)
    return NextResponse.json({ error: "Item not found on this price list" }, { status: 404 });
  return NextResponse.json(data);
}

// Remove a species from a price list.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("client_price_items")
    .delete()
    .eq("id", itemId)
    .eq("price_list_id", id)
    .select("id");

  if (error) {
    console.error("Price item delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't remove the species" }, { status: 400 });
  }
  if (!data?.length)
    return NextResponse.json({ error: "Item not found on this price list" }, { status: 404 });
  return NextResponse.json({ success: true });
}
