import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "iNA Ornamental Fish";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Pricing Template", {
    pageSetup: { orientation: "landscape" },
  });

  const headers = [
    "Name",
    "Class",
    "Scientific Name",
    "Size",
    "Availability",
    "Price",
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

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 24;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 14;

  for (const sp of species ?? []) {
    const sizes = sp.sizes?.length > 0 ? sp.sizes : ["-"];
    for (const size of sizes) {
      const row = ws.addRow([
        sp.common_name,
        sp.class_order ?? "",
        sp.scientific_name ?? "",
        size,
        sp.availability ?? "",
        "",
      ]);
      row.getCell(1).font = { size: 10 };
      row.getCell(2).font = { size: 10 };
      row.getCell(3).font = { size: 10, italic: true };
      row.getCell(4).font = { size: 10, italic: true };
      row.getCell(5).font = { size: 10 };
      row.getCell(6).numFmt = "$#,##0.00";
    }
  }

  const instrWs = workbook.addWorksheet("Instructions");
  instrWs.getColumn(1).width = 80;
  const instructions = [
    "INA ORNAMENTAL FISH - CUSTOM PRICING TEMPLATE",
    "",
    "HOW TO USE THIS TEMPLATE:",
    "1. Go to the 'Pricing Template' sheet",
    "2. Each row is a species + size combination",
    "3. Name, Class, Scientific Name, Size, and Availability are pre-filled",
    "4. Enter your custom price in the Price column",
    "5. Leave the price blank if you do not want to include a row",
    "6. Do not modify the Name, Class, Scientific Name, or Size columns",
    "7. You may edit the Availability column — on upload it updates the species' global availability",
    "8. Save the file and upload it in the Admin → Custom Pricing page",
    "",
    "NOTES:",
    "- Species names must match the pre-filled values",
    "- Prices should be in USD",
    "- You can delete rows for species you do not want to price",
  ];
  instructions.forEach((line, index) => {
    const row = instrWs.addRow([line]);
    if (index === 0) {
      row.getCell(1).font = {
        bold: true,
        size: 14,
        color: { argb: "3B655D" },
      };
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
        'attachment; filename="INA-Custom-Pricing-Template.xlsx"',
    },
  });
}
