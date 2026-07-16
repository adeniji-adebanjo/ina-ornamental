import ExcelJS from "exceljs";

interface InvoiceData {
  order_reference: string;
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  country?: string;
  delivery_address?: string;
  notes?: string;
  proposed_shipment_date?: string | null;
  consignee_name?: string | null;
  consignee_phone?: string | null;
  consignee_address?: string | null;
  groups: {
    name: string;
    items: {
      species_name: string;
      scientific_name?: string;
      size?: string;
      quantity: number;
      unit_price?: number | null;
    }[];
  }[];
}

const BRAND_GREEN = "3B655D";
const BRAND_GOLD = "D4A85F";
const HEADER_BG = "F5F3EE";

// Quote a sheet name for a cross-sheet formula reference (e.g. 'Order A'!E5).
function sheetRefName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

// Where the Performa summary should pull an item's Qty/Unit Price from, so its
// totals track edits made on the individual group sheets.
interface RefSource {
  sheetRef: string;
  firstRow: number;
}

function addInfoSection(ws: ExcelJS.Worksheet, data: InvoiceData) {
  // Company header
  const titleRow = ws.addRow(["INÁ Ornamental Fish"]);
  titleRow.getCell(1).font = {
    size: 18,
    bold: true,
    color: { argb: BRAND_GREEN },
  };
  ws.mergeCells(titleRow.number, 1, titleRow.number, 7);

  const tagRow = ws.addRow(["Premium West African Ornamental Fish Export"]);
  tagRow.getCell(1).font = {
    size: 10,
    italic: true,
    color: { argb: "8E8270" },
  };
  ws.mergeCells(tagRow.number, 1, tagRow.number, 7);

  ws.addRow([]);

  // Order info
  const infoFields: [string, string][] = [
    ["Order Reference", data.order_reference],
    [
      "Date",
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    ],
    ["Customer", data.customer_name],
  ];
  if (data.company_name) infoFields.push(["Company", data.company_name]);
  infoFields.push(["Email", data.email]);
  if (data.phone) infoFields.push(["Phone", data.phone]);
  if (data.country) infoFields.push(["Country", data.country]);
  if (data.delivery_address)
    infoFields.push(["Delivery Address", data.delivery_address]);
  if (data.proposed_shipment_date)
    infoFields.push(["Proposed Shipment", data.proposed_shipment_date]);
  if (data.consignee_name) infoFields.push(["Consignee", data.consignee_name]);
  if (data.consignee_phone)
    infoFields.push(["Consignee Phone", data.consignee_phone]);
  if (data.consignee_address)
    infoFields.push(["Consignee Address", data.consignee_address]);

  for (const [label, value] of infoFields) {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = { bold: true, size: 10, color: { argb: "8E8270" } };
    row.getCell(2).font = { size: 10 };
    ws.mergeCells(row.number, 2, row.number, 7);
  }

  ws.addRow([]);
}

interface ItemsTableResult {
  // Running item counter (the "#" column), so the summary can continue numbering.
  counter: number;
  // Sheet row numbers of the first/last data row, used to build SUM formulas.
  firstRow: number | null;
  lastRow: number | null;
}

function addItemsTable(
  ws: ExcelJS.Worksheet,
  items: InvoiceData["groups"][0]["items"],
  hasAnyPrice: boolean,
  startRowNum: number = 1,
  refSource?: RefSource,
): ItemsTableResult {
  let rowNum = startRowNum;

  // Table header
  const headers = ["#", "Species", "Scientific Name", "Size", "Qty"];
  if (hasAnyPrice) headers.push("Unit Price", "Total");

  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_GREEN },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "E2D8C8" } },
    };
  });
  headerRow.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
  headerRow.getCell(3).alignment = { vertical: "middle", horizontal: "left" };

  let firstRow: number | null = null;
  let lastRow: number | null = null;

  // Data rows
  for (const item of items) {
    const price = item.unit_price ?? 0;
    const values: (string | number)[] = [
      rowNum++,
      item.species_name,
      item.scientific_name || "",
      item.size || "-",
      item.quantity,
    ];
    if (hasAnyPrice) {
      values.push(price, price * item.quantity);
    }

    const row = ws.addRow(values);
    if (firstRow === null) firstRow = row.number;
    lastRow = row.number;

    // On the Performa summary, pull Qty/Unit Price from the matching row on the
    // group sheet, so edits there flow through to the summary's totals.
    if (refSource) {
      const srcRow = refSource.firstRow + (row.number - firstRow);
      row.getCell(5).value = {
        formula: `${refSource.sheetRef}!E${srcRow}`,
        result: item.quantity,
      };
      if (hasAnyPrice) {
        row.getCell(6).value = {
          formula: `${refSource.sheetRef}!F${srcRow}`,
          result: price,
        };
      }
    }

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(2).font = { bold: true, size: 10 };
    row.getCell(3).font = {
      italic: true,
      size: 10,
      color: { argb: "8E8270" },
    };
    row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(5).alignment = { horizontal: "center" };

    if (hasAnyPrice) {
      // Live total: Qty (col E) × Unit Price (col F). Editing either in the
      // downloaded sheet recalculates this cell. `result` is the cached value
      // so previews that don't recalculate still show the right number.
      row.getCell(7).value = {
        formula: `E${row.number}*F${row.number}`,
        result: price * item.quantity,
      };
      row.getCell(6).numFmt = "$#,##0.00";
      row.getCell(6).alignment = { horizontal: "right" };
      row.getCell(7).numFmt = "$#,##0.00";
      row.getCell(7).alignment = { horizontal: "right" };
    }

    // Alternating row fill
    if ((rowNum - 1) % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_BG },
        };
      });
    }

    row.eachCell((cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: "E2D8C8" } } };
    });
  }

  return { counter: rowNum, firstRow, lastRow };
}

function setupColumns(ws: ExcelJS.Worksheet) {
  ws.columns = [
    { key: "num", width: 5 },
    { key: "species", width: 30 },
    { key: "scientific", width: 28 },
    { key: "size", width: 12 },
    { key: "qty", width: 8 },
    { key: "price", width: 12 },
    { key: "total", width: 14 },
  ];
}

export async function buildInvoiceExcel(data: InvoiceData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INÁ Ornamental Fish";
  workbook.created = new Date();

  const hasAnyPrice = data.groups.some((g) =>
    g.items.some((i) => i.unit_price),
  );

  // Records where each group's items live on its own sheet, so the Performa
  // summary can reference them (index-aligned with data.groups).
  const groupSheetRefs: (RefSource | null)[] = [];

  // --- Create a sheet per order group ---
  for (const group of data.groups) {
    const sheetName = group.name.slice(0, 31); // Excel max 31 chars
    const ws = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });
    setupColumns(ws);

    addInfoSection(ws, data);

    const groupTitle = ws.addRow([group.name]);
    groupTitle.getCell(1).font = {
      size: 14,
      bold: true,
      color: { argb: BRAND_GREEN },
    };
    ws.mergeCells(groupTitle.number, 1, groupTitle.number, 7);
    ws.addRow([]);

    const table = addItemsTable(ws, group.items, hasAnyPrice);
    groupSheetRefs.push(
      table.firstRow !== null
        ? { sheetRef: sheetRefName(sheetName), firstRow: table.firstRow }
        : null,
    );

    ws.addRow([]);
    const groupQty = group.items.reduce((s, i) => s + i.quantity, 0);
    const totRow = ws.addRow(["", "", "", "Total Qty:", groupQty]);
    totRow.getCell(4).font = { bold: true, size: 11 };
    totRow.getCell(4).alignment = { horizontal: "right" };
    // Live SUM over the group's Qty cells.
    if (table.firstRow && table.lastRow) {
      totRow.getCell(5).value = {
        formula: `SUM(E${table.firstRow}:E${table.lastRow})`,
        result: groupQty,
      };
    }
    totRow.getCell(5).font = {
      bold: true,
      size: 11,
      color: { argb: BRAND_GREEN },
    };
    totRow.getCell(5).alignment = { horizontal: "center" };

    if (hasAnyPrice) {
      const groupTotal = group.items.reduce(
        (s, i) => s + i.quantity * (i.unit_price ?? 0),
        0,
      );
      totRow.getCell(6).value = "Total:";
      totRow.getCell(6).font = { bold: true, size: 11 };
      totRow.getCell(6).alignment = { horizontal: "right" };
      // Live SUM over the group's Total cells (which are themselves formulas).
      totRow.getCell(7).value =
        table.firstRow && table.lastRow
          ? {
              formula: `SUM(G${table.firstRow}:G${table.lastRow})`,
              result: groupTotal,
            }
          : groupTotal;
      totRow.getCell(7).numFmt = "$#,##0.00";
      totRow.getCell(7).font = {
        bold: true,
        size: 12,
        color: { argb: BRAND_GREEN },
      };
      totRow.getCell(7).alignment = { horizontal: "right" };
    }

    if (data.notes) {
      ws.addRow([]);
      const notesLabel = ws.addRow(["Notes"]);
      notesLabel.getCell(1).font = {
        bold: true,
        size: 10,
        color: { argb: "8E8270" },
      };
      const notesRow = ws.addRow([data.notes]);
      notesRow.getCell(1).font = { size: 10 };
      ws.mergeCells(notesRow.number, 1, notesRow.number, 7);
      notesRow.getCell(1).alignment = { wrapText: true };
    }

    ws.addRow([]);
    const footerRow = ws.addRow([
      "INÁ Ornamental Fish • Lagos, Nigeria • inaornamentalfish.com",
    ]);
    footerRow.getCell(1).font = {
      size: 9,
      italic: true,
      color: { argb: "B0A48E" },
    };
    ws.mergeCells(footerRow.number, 1, footerRow.number, 7);
    footerRow.getCell(1).alignment = { horizontal: "center" };
  }

  // --- Performa Invoice summary sheet ---
  const summaryWs = workbook.addWorksheet("Performa Invoice", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });
  setupColumns(summaryWs);
  addInfoSection(summaryWs, data);

  const sumTitle = summaryWs.addRow(["ORDER SUMMARY"]);
  sumTitle.getCell(1).font = {
    size: 14,
    bold: true,
    color: { argb: BRAND_GREEN },
  };
  summaryWs.mergeCells(sumTitle.number, 1, sumTitle.number, 7);
  summaryWs.addRow([]);

  let rowNum = 1;
  let summaryFirstRow: number | null = null;
  let summaryLastRow: number | null = null;
  data.groups.forEach((group, gi) => {
    if (data.groups.length > 1) {
      const gRow = summaryWs.addRow([group.name]);
      gRow.getCell(1).font = {
        size: 12,
        bold: true,
        color: { argb: BRAND_GOLD },
      };
      summaryWs.mergeCells(gRow.number, 1, gRow.number, 7);
      summaryWs.addRow([]);
    }
    const table = addItemsTable(
      summaryWs,
      group.items,
      hasAnyPrice,
      rowNum,
      groupSheetRefs[gi] ?? undefined,
    );
    rowNum = table.counter;
    if (table.firstRow !== null) {
      if (summaryFirstRow === null) summaryFirstRow = table.firstRow;
      summaryLastRow = table.lastRow;
    }
    summaryWs.addRow([]);
  });
  // Item rows sit contiguously (group titles/blank rows have empty Qty/Total
  // cells, so a single SUM range still totals only the line items).
  const summaryHasRange = summaryFirstRow !== null && summaryLastRow !== null;

  const totalItems = data.groups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  summaryWs.addRow([]);
  const grandRow = summaryWs.addRow([
    "",
    "",
    "",
    "Grand Total Qty:",
    totalItems,
  ]);
  grandRow.getCell(4).font = { bold: true, size: 12 };
  grandRow.getCell(4).alignment = { horizontal: "right" };
  // Live SUM across every line item's Qty.
  if (summaryHasRange) {
    grandRow.getCell(5).value = {
      formula: `SUM(E${summaryFirstRow}:E${summaryLastRow})`,
      result: totalItems,
    };
  }
  grandRow.getCell(5).font = {
    bold: true,
    size: 12,
    color: { argb: BRAND_GREEN },
  };
  grandRow.getCell(5).alignment = { horizontal: "center" };

  if (hasAnyPrice) {
    const grandTotal = data.groups.reduce(
      (sum, g) =>
        sum + g.items.reduce((s, i) => s + i.quantity * (i.unit_price ?? 0), 0),
      0,
    );
    grandRow.getCell(6).value = "Grand Total:";
    grandRow.getCell(6).font = { bold: true, size: 12 };
    grandRow.getCell(6).alignment = { horizontal: "right" };
    // Live SUM across every line item's Total.
    grandRow.getCell(7).value = summaryHasRange
      ? {
          formula: `SUM(G${summaryFirstRow}:G${summaryLastRow})`,
          result: grandTotal,
        }
      : grandTotal;
    grandRow.getCell(7).numFmt = "$#,##0.00";
    grandRow.getCell(7).font = {
      bold: true,
      size: 14,
      color: { argb: BRAND_GREEN },
    };
    grandRow.getCell(7).alignment = { horizontal: "right" };
  }

  if (data.notes) {
    summaryWs.addRow([]);
    const notesLabel = summaryWs.addRow(["Notes"]);
    notesLabel.getCell(1).font = {
      bold: true,
      size: 10,
      color: { argb: "8E8270" },
    };
    const notesRow = summaryWs.addRow([data.notes]);
    notesRow.getCell(1).font = { size: 10 };
    summaryWs.mergeCells(notesRow.number, 1, notesRow.number, 7);
    notesRow.getCell(1).alignment = { wrapText: true };
  }

  summaryWs.addRow([]);
  const footerRow = summaryWs.addRow([
    "INÁ Ornamental Fish • Lagos, Nigeria • inaornamentalfish.com",
  ]);
  footerRow.getCell(1).font = {
    size: 9,
    italic: true,
    color: { argb: "B0A48E" },
  };
  footerRow.getCell(1).alignment = { horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
