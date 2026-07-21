import { test, describe } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  buildPriceListExcel,
  buildPriceListCsv,
  type PriceListRow,
} from "@/lib/price-list-export";

const ROWS: PriceListRow[] = [
  {
    name: "Bichir",
    scientific: "Polypterus",
    size: "Small, Medium",
    availability: "In Stock",
    qtyPerBox: 50,
    price: 5,
  },
  {
    name: "Puffer",
    scientific: "Tetraodon",
    size: "Large",
    availability: "Limited",
    qtyPerBox: 30,
    price: 12.5,
  },
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

/** Data rows are the ones whose first cell is the row index number. */
function dataRows(ws: ExcelJS.Worksheet) {
  const out: ExcelJS.Row[] = [];
  ws.eachRow((row) => {
    if (typeof row.getCell(1).value === "number") out.push(row);
  });
  return out;
}

describe("buildPriceListExcel", () => {
  test("emits one info row per species with Size, Qty/Box and Unit Price", async () => {
    const ws = await load();
    const rows = dataRows(ws);
    assert.equal(rows.length, ROWS.length);
    rows.forEach((row, i) => {
      assert.equal(row.getCell(2).value, ROWS[i].name);
      assert.equal(row.getCell(3).value, ROWS[i].scientific);
      assert.equal(row.getCell(4).value, ROWS[i].size);
      assert.equal(row.getCell(5).value, ROWS[i].availability);
      assert.equal(row.getCell(6).value, ROWS[i].qtyPerBox);
      assert.equal(row.getCell(7).value, ROWS[i].price);
    });
  });

  test("Qty/Box and Unit Price cells stay numeric", async () => {
    const ws = await load();
    for (const row of dataRows(ws)) {
      assert.equal(typeof row.getCell(6).value, "number");
      assert.equal(typeof row.getCell(7).value, "number");
    }
    assert.ok(dataRows(ws).length > 0, "expected at least one data row");
  });

  test("contains no formulas — it is a price list, not an order form", async () => {
    const ws = await load();
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        const v = cell.value as { formula?: string } | null;
        assert.ok(
          !(v && typeof v === "object" && "formula" in v),
          `unexpected formula at ${cell.address}`,
        );
      });
    });
  });

  test("headers describe the info-only layout", async () => {
    const ws = await load();
    let header: ExcelJS.Row | undefined;
    ws.eachRow((row) => {
      if (row.getCell(1).value === "#") header = row;
    });
    assert.ok(header, "expected a header row");
    assert.deepEqual(
      [2, 3, 4, 5, 6, 7].map((c) => header!.getCell(c).value),
      [
        "Species",
        "Scientific Name",
        "Size",
        "Availability",
        "Qty/Box",
        "Unit Price",
      ],
    );
  });

  test("handles an empty price list without throwing", async () => {
    const ws = await load([]);
    assert.ok(ws.rowCount > 0);
    assert.equal(dataRows(ws).length, 0);
  });
});

describe("buildPriceListCsv", () => {
  test("emits plain values with the info-only headers", () => {
    const csv = buildPriceListCsv(ROWS);
    assert.ok(
      csv.includes(
        "Species,Scientific Name,Size,Availability,Qty/Box,Unit Price",
      ),
    );
    assert.ok(csv.includes("Bichir"));
    // A multi-size cell contains a comma — it must be quoted, not split.
    assert.ok(csv.includes('"Small, Medium"'));
    assert.ok(csv.includes("12.50"));
    assert.ok(!csv.includes("Line Total"), "no order-form columns");
    assert.ok(!csv.includes("="), "CSV must not contain formulas");
  });
});
