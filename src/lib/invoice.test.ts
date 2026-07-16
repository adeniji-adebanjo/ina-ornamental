import { test, describe } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildInvoiceExcel } from "@/lib/invoice";

async function loadInvoice(data: Parameters<typeof buildInvoiceExcel>[0]) {
  const buf = await buildInvoiceExcel(data);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cell(ws: ExcelJS.Worksheet, addr: string): any {
  return ws.getCell(addr).value;
}

const PRICED = {
  order_reference: "INA-T1",
  customer_name: "Acme",
  email: "a@b.com",
  groups: [
    {
      name: "Order A",
      items: [
        { species_name: "Bichir", quantity: 10, unit_price: 5 },
        { species_name: "Puffer", quantity: 4, unit_price: 12 },
      ],
    },
    { name: "Order B", items: [{ species_name: "Tetra", quantity: 20, unit_price: 1.5 }] },
  ],
};

describe("buildInvoiceExcel", () => {
  test("creates one sheet per group plus the Performa summary", async () => {
    const wb = await loadInvoice(PRICED);
    const names = wb.worksheets.map((w) => w.name);
    assert.ok(names.includes("Order A"));
    assert.ok(names.includes("Order B"));
    assert.ok(names.includes("Performa Invoice"));
  });

  test("per-item total is a =Qty*UnitPrice formula with the correct cached result", async () => {
    const wb = await loadInvoice(PRICED);
    const ws = wb.getWorksheet("Order A")!;
    // First data row is 12 (info block + headers precede it).
    const g12 = cell(ws, "G12");
    assert.equal(g12.formula, "E12*F12");
    assert.equal(g12.result, 50);
  });

  test("group total is a =SUM formula equal to the sum of line items", async () => {
    const wb = await loadInvoice(PRICED);
    const ws = wb.getWorksheet("Order A")!;
    const total = cell(ws, "G15");
    assert.ok(String(total.formula).startsWith("SUM("));
    assert.equal(total.result, 98); // 10*5 + 4*12
  });

  test("Performa grand total references flow from the group sheets", async () => {
    const wb = await loadInvoice(PRICED);
    const perf = wb.getWorksheet("Performa Invoice")!;
    // A referenced Qty cell points at a group sheet.
    let sawRef = false;
    let grand = 0;
    perf.eachRow((row) => {
      const e = row.getCell(5).value as { formula?: string } | null;
      if (e && typeof e === "object" && /!E\d+$/.test(e.formula ?? "")) sawRef = true;
      const g = row.getCell(7).value as { formula?: string; result?: number } | null;
      if (g && typeof g === "object" && String(g.formula).startsWith("SUM("))
        grand = g.result ?? 0;
    });
    assert.ok(sawRef, "expected a cross-sheet Qty reference");
    assert.equal(grand, 128); // 50 + 48 + 30
  });

  test("omits price columns when no item has a price", async () => {
    const wb = await loadInvoice({
      order_reference: "INA-T2",
      customer_name: "X",
      email: "x@y.com",
      groups: [{ name: "Order A", items: [{ species_name: "Bichir", quantity: 3 }] }],
    });
    const ws = wb.getWorksheet("Order A")!;
    // Header row is the 5-column form: no "Unit Price"/"Total".
    let headerCols = 0;
    ws.eachRow((row) => {
      if (row.getCell(1).value === "#") headerCols = row.cellCount;
    });
    assert.equal(headerCols, 5);
  });

  test("sanitizes and de-duplicates illegal / colliding sheet names", async () => {
    const wb = await loadInvoice({
      order_reference: "INA-T3",
      customer_name: "X",
      email: "x@y.com",
      groups: [
        { name: "Order A/B: [x]", items: [{ species_name: "A", quantity: 1, unit_price: 2 }] },
        { name: "Performa Invoice", items: [{ species_name: "B", quantity: 1, unit_price: 3 }] },
      ],
    });
    const names = wb.worksheets.map((w) => w.name);
    // Illegal \ / ? * [ ] : removed.
    assert.ok(names.some((n) => n === "Order A B x"));
    // The group named like the summary is de-duplicated, not a collision.
    assert.ok(names.includes("Performa Invoice"));
    assert.ok(names.some((n) => n.startsWith("Performa Invoice (")));
  });

  test("coerces decimal-string prices to numeric cells", async () => {
    const wb = await loadInvoice({
      order_reference: "INA-T4",
      customer_name: "X",
      email: "x@y.com",
      groups: [
        {
          name: "Order A",
          // As Supabase returns decimals — strings.
          items: [{ species_name: "A", quantity: 2, unit_price: "12.5" as unknown as number }],
        },
      ],
    });
    const ws = wb.getWorksheet("Order A")!;
    assert.equal(typeof cell(ws, "F12"), "number");
  });
});
