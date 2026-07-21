import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  buildPriceListCsv,
  buildPriceListExcel,
  type PriceListRow,
} from "@/lib/price-list-export";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "In Stock",
  limited_stock: "Limited",
  out_of_stock: "Out of Stock",
  seasonal: "Seasonal",
  on_request: "On Request",
};

interface PriceItemRow {
  custom_price: number | string | null;
  sort_order?: number | null;
  species: {
    common_name: string | null;
    scientific_name: string | null;
    availability: string | null;
  } | null;
}

// Download a client price list as a fillable order form. The Excel version
// carries live formulas (Qty × Unit Price, SUM totals); CSV is plain values.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format =
    new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const admin = await createAdminSupabaseClient();
  const { data: list, error } = await admin
    .from("client_price_lists")
    .select(
      "*, client:clients(*), items:client_price_items(*, species:species(common_name, scientific_name, availability))",
    )
    .eq("id", id)
    .single();

  if (error || !list)
    return NextResponse.json({ error: "Price list not found" }, { status: 404 });

  const items: PriceItemRow[] = [...(list.items ?? [])].sort(
    (a: PriceItemRow, b: PriceItemRow) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const rows: PriceListRow[] = items.map((it) => ({
    name: it.species?.common_name ?? "",
    scientific: it.species?.scientific_name ?? "",
    availability:
      AVAILABILITY_LABELS[it.species?.availability ?? ""] ??
      it.species?.availability ??
      "",
    // Postgres decimals arrive as strings — coerce so the cell stays numeric.
    price: Number(it.custom_price) || 0,
  }));

  const date = new Date().toISOString().slice(0, 10);
  const safeSlug = String(list.slug || "price-list").replace(/[^a-z0-9-]+/gi, "-");
  const filenameBase = `INA-PriceList-${safeSlug}-${date}`;

  if (format === "csv") {
    return new Response(buildPriceListCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      },
    });
  }

  const buffer = await buildPriceListExcel({
    title: String(list.title ?? "Price List"),
    clientName: list.client?.name ?? null,
    clientCompany: list.client?.company ?? null,
    validFrom: list.valid_from ?? null,
    validUntil: list.valid_until ?? null,
    generatedDate: date,
    rows,
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
    },
  });
}
