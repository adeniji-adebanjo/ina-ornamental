import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import type {
  OrderWithGroups,
  OrderGroup,
  OrderItem,
} from "@/types/database";

export async function GET() {
  // Require an authenticated admin — this endpoint uses the service-role key.
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminSupabaseClient();

  // Fetch orders with groups and items
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`*, order_groups(*, order_items(*))`)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build CSV
  const rows: string[] = [];
  const headers = [
    "order_reference",
    "customer_name",
    "company_name",
    "email",
    "phone",
    "country",
    "delivery_address",
    "submitted_at",
    "groups_json",
  ];
  rows.push(headers.join(","));

  for (const o of (orders ?? []) as OrderWithGroups[]) {
    const groups = (o.order_groups || []).map(
      (g: OrderGroup & { order_items: OrderItem[] }) => ({
        group_name: g.group_name,
        items: (g.order_items || []).map((it: OrderItem) => ({
          species_name: it.species_name,
          scientific_name: it.scientific_name,
          size: it.size,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      }),
    );

    const row = [
      o.order_reference,
      o.customer_name,
      o.company_name || "",
      o.email,
      o.phone || "",
      o.country || "",
      (o.delivery_address || "").replace(/\n/g, " ").replace(/,/g, ";"),
      o.submitted_at,
      JSON.stringify(groups).replace(/"/g, '"'),
    ];
    // Escape commas inside fields by wrapping with quotes
    const esc = row.map((r) => {
      if (String(r).includes(",")) return `"${String(r).replace(/"/g, '"')}"`;
      return String(r);
    });
    rows.push(esc.join(","));
  }

  const csv = rows.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ina-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
