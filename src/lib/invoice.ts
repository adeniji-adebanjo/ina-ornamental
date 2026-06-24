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

function addItemsTable(
  ws: ExcelJS.Worksheet,
  items: InvoiceData["groups"][0]["items"],
  hasAnyPrice: boolean,
  startRowNum: number = 1,
): number {
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

  // Data rows
  for (const item of items) {
    const values: (string | number)[] = [
      rowNum++,
      item.species_name,
      item.scientific_name || "",
      item.size || "-",
      item.quantity,
    ];
    if (hasAnyPrice) {
      const price = item.unit_price ?? 0;
      values.push(price, price * item.quantity);
    }

    const row = ws.addRow(values);
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

  return rowNum;
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

    addItemsTable(ws, group.items, hasAnyPrice);

    ws.addRow([]);
    const groupQty = group.items.reduce((s, i) => s + i.quantity, 0);
    const totRow = ws.addRow(["", "", "", "Total Qty:", groupQty]);
    totRow.getCell(4).font = { bold: true, size: 11 };
    totRow.getCell(4).alignment = { horizontal: "right" };
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
      totRow.getCell(7).value = groupTotal;
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
  for (const group of data.groups) {
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
    rowNum = addItemsTable(summaryWs, group.items, hasAnyPrice, rowNum);
    summaryWs.addRow([]);
  }

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
    grandRow.getCell(7).value = grandTotal;
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
