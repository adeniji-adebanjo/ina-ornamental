import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateOrderReference } from "@/lib/queries/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const {
    customer_name,
    company_name,
    email,
    phone,
    country,
    delivery_address,
    notes,
    groups,
    price_list_id,
    client_id,
  } = body;

  if (!customer_name || !email || !groups?.length) {
    return NextResponse.json(
      { error: "Missing required fields: customer_name, email, groups" },
      { status: 400 },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  const order_reference = generateOrderReference();

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_reference,
      customer_name,
      company_name: company_name || null,
      email,
      phone: phone || null,
      country: country || null,
      delivery_address: delivery_address || null,
      notes: notes || null,
      status: "submitted",
      client_id: client_id || null,
      price_list_id: price_list_id || null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Insert groups and items
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const { data: groupData, error: groupError } = await supabase
      .from("order_groups")
      .insert({
        order_id: order.id,
        group_name: group.name || `Order ${String.fromCharCode(65 + i)}`,
        sort_order: i,
      })
      .select()
      .single();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    if (group.items?.length) {
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
          species_id: item.species_id,
          species_name: item.species_name,
          scientific_name: item.scientific_name || null,
          size: item.size || null,
          quantity: item.quantity,
          unit_price: item.unit_price || null,
        }),
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) {
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 },
        );
      }
    }
  }

  // Send email notifications (non-blocking)
  sendOrderConfirmation({
    order_reference,
    customer_name,
    company_name,
    email,
    phone,
    country,
    delivery_address,
    notes,
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
  }).catch(console.error);

  return NextResponse.json({
    success: true,
    order_reference,
    order_id: order.id,
  });
}
