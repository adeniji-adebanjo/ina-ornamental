import { test, describe } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  buildPriceListExcel,
  buildPriceListCsv,
  type PriceListRow,
} from "@/lib/price-list-export";

const ROWS: PriceListRow[] = [
  { name: "Bichir", scientific: "Polypterus", availability: "In Stock", price: 5 },
  { name: "Puffer", scientific: "Tetraodon", availability: "Limited", price: 12.5 },
];

async function load(rows: PriceListRow[] = ROWS) {
  const buf = await buildPriceListExcel({
    title: "Acme Price List",
    clientName: "Acme",
    validUntil: null,
    generatedDate: "2026-07-05",
    rows,
  });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb.getWorksheet("Price List")!;
}

describe("buildPriceListExcel", () => {
  test("line total is a live =UnitPrice*Qty formula on every row", async () => {
    const ws = await load();
    // Find the data rows by their Line Total formulas.
    const formulas: string[] = [];
    ws.eachRow((row) => {
      const g = row.getCell(7).value as { formula?: string } | null;
      if (g && typeof g === "object" && g.formula && !g.formula.startsWith("SUM"))
        formulas.push(g.formula);
    });
    assert.equal(formulas.length, ROWS.length);
    for (const f of formulas) assert.match(f, /^E\d+\*F\d+$/);
  });

  test("totals row sums the Qty and Line Total columns", async () => {
    const ws = await load();
    let qtySum: string | undefined;
    let totalSum: string | undefined;
    ws.eachRow((row) => {
      const f = row.getCell(6).value as { formula?: string } | null;
      const g = row.getCell(7).value as { formula?: string } | null;
      if (f && typeof f === "object" && String(f.formula).startsWith("SUM"))
        qtySum = f.formula;
      if (g && typeof g === "object" && String(g.formula).startsWith("SUM"))
        totalSum = g.formula;
    });
    assert.match(String(qtySum), /^SUM\(F\d+:F\d+\)$/);
    assert.match(String(totalSum), /^SUM\(G\d+:G\d+\)$/);
  });

  test("unit price cells are numeric and Qty starts empty", async () => {
    const ws = await load();
    let checked = false;
    ws.eachRow((row) => {
      const g = row.getCell(7).value as { formula?: string } | null;
      if (g && typeof g === "object" && g.formula && !g.formula.startsWith("SUM")) {
        assert.equal(typeof row.getCell(5).value, "number");
        assert.ok(row.getCell(6).value == null, "Qty should start blank");
        checked = true;
      }
    });
    assert.ok(checked, "expected at least one data row");
  });

  test("handles an empty price list without throwing", async () => {
    const ws = await load([]);
    assert.ok(ws.rowCount > 0);
  });
});

describe("buildPriceListCsv", () => {
  test("emits plain values with headers and no formulas", () => {
    const csv = buildPriceListCsv(ROWS);
    assert.ok(csv.includes("Species,Scientific Name,Availability,Unit Price,Qty,Line Total"));
    assert.ok(csv.includes("Bichir"));
    assert.ok(csv.includes("12.50"));
    assert.ok(!csv.includes("="), "CSV must not contain formulas");
  });
});
