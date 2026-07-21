import ExcelJS from "exceljs";
import { toCsv } from "@/lib/csv";

const BRAND_GREEN = "3B655D";
const HEADER_BG = "F5F3EE";
const COL_COUNT = 7; // # + 6 data columns

export interface PriceListRow {
  name: string;
  scientific: string;
  /** Species sizes, comma-joined (e.g. "Small, Medium"). */
  size: string;
  availability: string;
  /** Species-level packing info — identical for every client. */
  qtyPerBox: number;
  /** The one value that is client-specific. */
  price: number;
}

export interface PriceListExportInput {
  title: string;
  clientName?: string | null;
  clientCompany?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  generatedDate: string;
  rows: PriceListRow[];
}

export const PRICE_LIST_HEADERS = [
  "Species",
  "Scientific Name",
  "Size",
  "Availability",
  "Qty/Box",
  "Unit Price",
];

export function buildPriceListCsv(rows: PriceListRow[]): string {
  const body = rows.map((r) => [
    r.name,
    r.scientific,
    r.size,
    r.availability,
    r.qtyPerBox,
    r.price.toFixed(2),
  ]);
  // BOM so Excel opens UTF-8 correctly.
  return "﻿" + toCsv([PRICE_LIST_HEADERS, ...body]);
}

/**
 * A client's price list as an informational document (not an order form).
 * Columns: A #, B Species, C Scientific Name, D Size, E Availability,
 *          F Qty/Box, G Unit Price
 *
 * Only the Unit Price is client-specific; species details, sizes and Qty/Box are
 * the same for every client. There are deliberately no fillable quantity or total
 * columns — this sheet states prices, it does not capture an order.
 */
export async function buildPriceListExcel(
  input: PriceListExportInput,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INÁ Ornamental Fish";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Price List", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });
  ws.columns = [
    { width: 5 }, // #
    { width: 30 }, // Species
    { width: 26 }, // Scientific Name
    { width: 20 }, // Size
    { width: 15 }, // Availability
    { width: 10 }, // Qty/Box
    { width: 13 }, // Unit Price
  ];

  const title = ws.addRow(["INÁ Ornamental Fish"]);
  title.getCell(1).font = { size: 18, bold: true, color: { argb: BRAND_GREEN } };
  ws.mergeCells(title.number, 1, title.number, COL_COUNT);
  const sub = ws.addRow([input.title]);
  sub.getCell(1).font = { size: 12, bold: true, color: { argb: "8E8270" } };
  ws.mergeCells(sub.number, 1, sub.number, COL_COUNT);
  ws.addRow([]);

  // Header block — the per-client context.
  const info: [string, string][] = [];
  if (input.clientName) info.push(["Client", input.clientName]);
  if (input.clientCompany) info.push(["Company", input.clientCompany]);
  if (input.validFrom) info.push(["Valid From", input.validFrom]);
  info.push(["Valid Until", input.validUntil || "No expiry"]);
  info.push(["Generated", input.generatedDate]);
  for (const [label, value] of info) {
    const r = ws.addRow([label, value]);
    r.getCell(1).font = { bold: true, size: 10, color: { argb: "8E8270" } };
    r.getCell(2).font = { size: 10 };
    ws.mergeCells(r.number, 2, r.number, COL_COUNT);
  }
  ws.addRow([]);

  const headerRow = ws.addRow(["#", ...PRICE_LIST_HEADERS]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_GREEN },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
  headerRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

  input.rows.forEach((r, i) => {
    const row = ws.addRow([
      i + 1,
      r.name,
      r.scientific,
      r.size,
      r.availability,
      r.qtyPerBox,
      r.price,
    ]);
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).font = { bold: true, size: 10 };
    row.getCell(3).font = { italic: true, size: 10, color: { argb: "8E8270" } };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };
    row.getCell(6).alignment = { horizontal: "center" };
    row.getCell(7).numFmt = "$#,##0.00";
    row.getCell(7).alignment = { horizontal: "right" };
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_BG },
        };
      });
    }
  });

  ws.addRow([]);
  const note = ws.addRow([
    "Prices are specific to this client and valid for the period shown. Size and Qty/Box are standard and the same for all clients.",
  ]);
  note.getCell(1).font = { size: 9, italic: true, color: { argb: "8E8270" } };
  ws.mergeCells(note.number, 1, note.number, COL_COUNT);

  const footer = ws.addRow([
    "INÁ Ornamental Fish • Lagos, Nigeria • inaornamentalfish.com",
  ]);
  footer.getCell(1).font = { size: 9, italic: true, color: { argb: "B0A48E" } };
  ws.mergeCells(footer.number, 1, footer.number, COL_COUNT);
  footer.getCell(1).alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
