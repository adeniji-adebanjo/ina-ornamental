import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

// Downloadable Excel template for the admin "Upload Order" feature. Holds the
// line items only — customer/shipment details are entered in the upload dialog.
export async function GET() {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { data: species } = await admin
    .from("species")
    .select("common_name, scientific_name, sizes")
    .order("common_name")
    .limit(3);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INÁ Ornamental Fish";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Order Items");
  const headers = [
    "Group",
    "Species",
    "Scientific Name",
    "Size",
    "Quantity",
    "Unit Price",
  ];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "3B655D" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 26;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 12;
  ws.getColumn(6).width = 14;

  // A couple of sample rows using real species so names resolve on upload.
  const samples = species ?? [];
  samples.forEach((sp, i) => {
    const size = sp.sizes?.length > 0 ? sp.sizes[0] : "";
    const row = ws.addRow([
      i === 0 ? "Order A" : "Order B",
      sp.common_name,
      sp.scientific_name ?? "",
      size,
      (i + 1) * 5,
      "",
    ]);
    row.getCell(6).numFmt = "$#,##0.00";
  });
  if (samples.length === 0) {
    ws.addRow(["Order A", "Example species name", "", "M", 10, ""]);
  }

  const instrWs = workbook.addWorksheet("Instructions");
  instrWs.getColumn(1).width = 84;
  const instructions = [
    "INÁ ORNAMENTAL FISH — ORDER UPLOAD TEMPLATE",
    "",
    "HOW TO USE THIS TEMPLATE:",
    "1. Enter one line item per row on the 'Order Items' sheet.",
    "2. Group — the order group this item belongs to (e.g. 'Order A', 'Order B').",
    "   Leave blank to put the item in 'Order A'.",
    "3. Species — the common name (or scientific name) exactly as in the catalogue.",
    "4. Scientific Name and Size are optional and stored with the line item.",
    "5. Quantity — a whole number greater than 0 (required).",
    "6. Unit Price — optional price in USD per fish.",
    "7. Save the file, then upload it under Admin → Orders → Upload Order and fill",
    "   in the customer / shipment details there.",
    "",
    "NOTES:",
    "- One upload creates ONE order with a new INA-… reference.",
    "- Species names must match an existing species, or the row is rejected.",
    "- CSV files are also accepted.",
  ];
  instructions.forEach((line, i) => {
    const row = instrWs.addRow([line]);
    if (i === 0)
      row.getCell(1).font = { bold: true, size: 14, color: { argb: "3B655D" } };
    else if (line.startsWith("HOW") || line.startsWith("NOTES"))
      row.getCell(1).font = { bold: true, size: 11 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="INA-Order-Upload-Template.xlsx"',
    },
  });
}
