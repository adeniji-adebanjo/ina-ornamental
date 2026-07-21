import ExcelJS from "exceljs";
import { toCsv } from "@/lib/csv";

const BRAND_GREEN = "3B655D";
const HEADER_BG = "F5F3EE";

export interface PriceListRow {
  name: string;
  scientific: string;
  availability: string;
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
  "Availability",
  "Unit Price",
  "Qty",
  "Line Total",
];

// CSV stays plain-valued: a formula string in CSV behaves inconsistently across
// apps and is a CSV-injection vector.
export function buildPriceListCsv(rows: PriceListRow[]): string {
  const body = rows.map((r) => [
    r.name,
    r.scientific,
    r.availability,
    r.price.toFixed(2),
    "",
    "",
  ]);
  // BOM so Excel opens UTF-8 correctly.
  return "﻿" + toCsv([PRICE_LIST_HEADERS, ...body]);
}

/**
 * Price list as a fillable order form. Columns:
 *   A #, B Species, C Scientific Name, D Availability, E Unit Price, F Qty, G Line Total
 * Line Total is a live `=E*F` formula and the totals row is `=SUM(...)`, so the
 * client types quantities and every total recalculates on their machine.
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
    { width: 5 },
    { width: 30 },
    { width: 28 },
    { width: 14 },
    { width: 12 },
    { width: 10 },
    { width: 14 },
  ];

  const title = ws.addRow(["INÁ Ornamental Fish"]);
  title.getCell(1).font = { size: 18, bold: true, color: { argb: BRAND_GREEN } };
  ws.mergeCells(title.number, 1, title.number, 7);
  const sub = ws.addRow([input.title]);
  sub.getCell(1).font = { size: 12, bold: true, color: { argb: "8E8270" } };
  ws.mergeCells(sub.number, 1, sub.number, 7);
  ws.addRow([]);

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
    ws.mergeCells(r.number, 2, r.number, 7);
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

  let firstRow: number | null = null;
  let lastRow: number | null = null;
  input.rows.forEach((r, i) => {
    const row = ws.addRow([
      i + 1,
      r.name,
      r.scientific,
      r.availability,
      r.price,
      null,
      null,
    ]);
    if (firstRow === null) firstRow = row.number;
    lastRow = row.number;

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).font = { bold: true, size: 10 };
    row.getCell(3).font = { italic: true, size: 10, color: { argb: "8E8270" } };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).numFmt = "$#,##0.00";
    row.getCell(6).alignment = { horizontal: "center" };
    // Live line total: Unit Price (E) x Qty (F).
    row.getCell(7).value = { formula: `E${row.number}*F${row.number}`, result: 0 };
    row.getCell(7).numFmt = "$#,##0.00";
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

  if (firstRow && lastRow) {
    ws.addRow([]);
    const totals = ws.addRow(["", "", "", "Totals:", "", null, null]);
    totals.getCell(4).font = { bold: true, size: 11 };
    totals.getCell(4).alignment = { horizontal: "right" };
    totals.getCell(6).value = {
      formula: `SUM(F${firstRow}:F${lastRow})`,
      result: 0,
    };
    totals.getCell(6).font = {
      bold: true,
      size: 11,
      color: { argb: BRAND_GREEN },
    };
    totals.getCell(6).alignment = { horizontal: "center" };
    totals.getCell(7).value = {
      formula: `SUM(G${firstRow}:G${lastRow})`,
      result: 0,
    };
    totals.getCell(7).numFmt = "$#,##0.00";
    totals.getCell(7).font = {
      bold: true,
      size: 12,
      color: { argb: BRAND_GREEN },
    };
    totals.getCell(7).alignment = { horizontal: "right" };
  }

  ws.addRow([]);
  const note = ws.addRow([
    "Enter your quantities in the Qty column — Line Total and Totals update automatically.",
  ]);
  note.getCell(1).font = { size: 9, italic: true, color: { argb: "8E8270" } };
  ws.mergeCells(note.number, 1, note.number, 7);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
