import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import ExcelJS from "exceljs";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { data: species } = await admin
    .from("species")
    .select("common_name, class_order, scientific_name, sizes, availability")
    .order("common_name");

  // Get existing locations
  const { data: existingPricing } = await admin
    .from("location_pricing")
    .select("location");
  const existingLocations = [
    ...new Set((existingPricing ?? []).map((r) => r.location)),
  ];
  const sampleLocations =
    existingLocations.length > 0
      ? existingLocations
      : ["Europe", "Asia", "USA", "South America", "Middle East"];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INÁ Ornamental Fish";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Pricing Template", {
    pageSetup: { orientation: "landscape" },
  });

  // Headers
  const headers = [
    "Name",
    "Class",
    "Scientific Name",
    "Size",
    "Availability",
    ...sampleLocations,
  ];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3B655D" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  headerRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

  // Column widths
  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 12;
  for (let i = 3; i <= headers.length; i++) {
    ws.getColumn(i).width = 14;
  }

  // Data rows: one row per species per size
  for (const sp of species ?? []) {
    const sizes = sp.sizes?.length > 0 ? sp.sizes : ["-"];
    for (const size of sizes) {
      const row = ws.addRow([
        sp.common_name,
        sp.class_order ?? "",
        sp.scientific_name ?? "",
        size,
        sp.availability ?? "",
        ...sampleLocations.map(() => ""),
      ]);
      row.getCell(1).font = { size: 10 };
      row.getCell(2).font = { size: 10 };
      row.getCell(3).font = { size: 10, italic: true };
      row.getCell(4).font = { size: 10, italic: true };
      row.getCell(5).font = { size: 10 };
      // Format price columns as number
      for (let i = 6; i <= headers.length; i++) {
        row.getCell(i).numFmt = "$#,##0.00";
      }
    }
  }

  // Instructions sheet
  const instrWs = workbook.addWorksheet("Instructions");
  instrWs.getColumn(1).width = 80;
  const instructions = [
    "INÁ ORNAMENTAL FISH - LOCATION PRICING TEMPLATE",
    "",
    "HOW TO USE THIS TEMPLATE:",
    "1. Go to the 'Pricing Template' sheet",
    "2. Each row is a species + size combination",
    "3. Name, Class, Scientific Name, Size, and Availability are pre-filled for reference",
    "4. Location columns (Europe, Asia, etc.) represent destination regions",
    "5. Enter the price (USD) for each species/size at each location",
    "6. Leave blank if a species is not available for that location",
    "7. You can add more location columns — just add a new column header",
    "8. You can rename location columns to match your regions",
    "9. Save and upload this file in the Admin → Location Pricing page",
    "",
    "NOTES:",
    "- Species names must match exactly (they are pre-filled for you)",
    "- Prices should be in USD",
    "- Do not modify the Name, Class, Scientific Name, or Size columns",
    "- Editing the Availability column updates the species' global availability on upload",
    "- You can delete rows for species you don't want to price",
  ];
  instructions.forEach((line, i) => {
    const row = instrWs.addRow([line]);
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 14, color: { argb: "3B655D" } };
    } else if (line.startsWith("HOW") || line.startsWith("NOTES")) {
      row.getCell(1).font = { bold: true, size: 11 };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="INA-Location-Pricing-Template.xlsx"',
    },
  });
}
