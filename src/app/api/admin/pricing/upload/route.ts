import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import ExcelJS from "exceljs";

// Parse an uploaded Excel file and return species_id + price pairs
// Expected format: Column A = Species Name, Column B = Price
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuf = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(Buffer.from(arrayBuf) as any);

  const admin = await createAdminSupabaseClient();
  const { data: allSpecies } = await admin
    .from("species")
    .select("id, common_name, slug");

  const speciesMap = new Map<string, string>();
  for (const s of allSpecies ?? []) {
    speciesMap.set(s.common_name.toLowerCase(), s.id);
    speciesMap.set(s.slug.toLowerCase(), s.id);
  }

  const ws = workbook.worksheets[0];
  if (!ws) {
    return NextResponse.json(
      { error: "No worksheet found in file" },
      { status: 400 },
    );
  }

  const items: { species_id: string; price: number }[] = [];
  const errors: string[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    const speciesName = String(row.getCell(1).value || "").trim();
    const priceVal = row.getCell(2).value;
    const price = Number(priceVal);

    if (!speciesName) return;

    const speciesId = speciesMap.get(speciesName.toLowerCase());
    if (!speciesId) {
      errors.push(`Row ${rowNumber}: Unknown species "${speciesName}"`);
      return;
    }

    if (!priceVal || isNaN(price) || price <= 0) {
      errors.push(`Row ${rowNumber}: Invalid price for "${speciesName}"`);
      return;
    }

    items.push({ species_id: speciesId, price });
  });

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No valid pricing data found", errors },
      { status: 400 },
    );
  }

  return NextResponse.json({ items, errors });
}
