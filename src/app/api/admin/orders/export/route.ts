import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { toCsv } from "@/lib/csv";
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
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminSupabaseClient();

  // Fetch every order with groups and items (paged past the 1000-row cap).
  const { data: orders, error } = await fetchAllRows((from, to) =>
    supabase
      .from("orders")
      .select(`*, order_groups(*, order_items(*))`)
      .order("submitted_at", { ascending: false })
      .order("id")
      .range(from, to),
  );

  if (error) {
    console.error("Orders export failed:", error.message);
    return NextResponse.json(
      { error: "Couldn't export orders. Please try again." },
      { status: 500 },
    );
  }

  const rows: unknown[][] = [];
  const headers = [
    "order_reference",
    "customer_name",
    "company_name",
    "email",
    "phone",
    "country",
    "delivery_address",
    "awb_number",
    "airline_name",
    "manual_status",
    "submitted_at",
    "groups_json",
  ];
  rows.push(headers);

  for (const o of orders as OrderWithGroups[]) {
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

    // toCsv quotes any field containing , " or a newline and doubles inner
    // quotes (RFC 4180), so addresses and the JSON column stay one cell.
    rows.push([
      o.order_reference,
      o.customer_name,
      o.company_name,
      o.email,
      o.phone,
      o.country,
      o.delivery_address,
      o.awb_number,
      o.airline_name,
      o.manual_status,
      o.submitted_at,
      JSON.stringify(groups),
    ]);
  }

  // BOM so Excel opens it as UTF-8 (names like "INÁ" otherwise garble).
  const csv = "﻿" + toCsv(rows);

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
