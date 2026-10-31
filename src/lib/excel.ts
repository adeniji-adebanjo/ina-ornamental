// Helpers for reading user-uploaded spreadsheets via ExcelJS.
import ExcelJS from "exceljs";
import { Readable } from "stream";
import type { SupabaseClient } from "@supabase/supabase-js";

// Load an uploaded spreadsheet into a workbook, accepting both Excel
// (.xlsx/.xls) and CSV files. CSV is read into worksheets[0] with the same
// row/cell structure, so all downstream parsing stays identical.
export async function loadWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const arrayBuf = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/csv";
  if (isCsv) {
    const stream = Readable.from(Buffer.from(arrayBuf).toString("utf-8"));
    await workbook.csv.read(stream);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(Buffer.from(arrayBuf) as any);
  }
  return workbook;
}

// ExcelJS cell values aren't always primitives: formula cells, rich text and
// hyperlinks come back as objects. Flatten any of them to plain text.
export function cellText(value: unknown): string {
  if (value == null) return "";
  // Excel (and ExcelJS's CSV reader) turn entries like "3/4" or "2026-01-05"
  // into dates. Returning "" dropped them silently; an ISO date at least
  // keeps the cell visible so a wrong value can be spotted and fixed.
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.richText))
      return (v.richText as { text?: string }[])
        .map((r) => r.text ?? "")
        .join("");
    if ("result" in v) return cellText(v.result);
    if ("text" in v) return String(v.text);
    return "";
  }
  return String(value);
}

// Prices are frequently typed with currency symbols or locale separators
// ("$12.50", "12,50", "1,250.00"). Strip decoration and normalise separators
// before parsing so valid entries aren't silently dropped as NaN.
export function parsePrice(value: unknown): number {
  if (typeof value === "number") return value;
  let s = cellText(value).trim();
  if (!s) return NaN;
  s = s.replace(/[^0-9.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    // Mixed separators: treat comma as a thousands separator (e.g. 1,250.00).
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    const parts = s.split(",");
    // A lone comma with 1–2 trailing digits is a decimal comma (e.g. 12,50).
    s =
      parts.length === 2 && parts[1].length <= 2
        ? parts.join(".")
        : s.replace(/,/g, "");
  }
  return Number(s);
}

// Free-text → canonical `availability_status` enum value. Accepts both the
// stored keys and common human labels. Returns null for blank/unrecognised
// cells so we never write an invalid value or wipe existing data.
const AVAILABILITY_ALIASES: Record<string, string> = {
  available: "available",
  "in stock": "available",
  instock: "available",
  limited: "limited_stock",
  "limited stock": "limited_stock",
  limited_stock: "limited_stock",
  "out of stock": "out_of_stock",
  out_of_stock: "out_of_stock",
  "sold out": "out_of_stock",
  unavailable: "out_of_stock",
  seasonal: "seasonal",
  "on request": "on_request",
  on_request: "on_request",
  request: "on_request",
};

export function normalizeAvailability(value: unknown): string | null {
  const s = cellText(value).trim().toLowerCase();
  if (!s) return null;
  return AVAILABILITY_ALIASES[s] ?? null;
}

// Write availability values back to the global species records, grouped by
// value so we issue at most one update per distinct availability. Returns the
// number of species updated.
export async function applyAvailabilityUpdates(
  admin: SupabaseClient,
  availabilityById: Map<string, string>,
): Promise<number> {
  if (availabilityById.size === 0) return 0;
  const idsByValue = new Map<string, string[]>();
  for (const [id, avail] of availabilityById) {
    const list = idsByValue.get(avail) ?? [];
    list.push(id);
    idsByValue.set(avail, list);
  }
  let updated = 0;
  for (const [avail, ids] of idsByValue) {
    const { error } = await admin
      .from("species")
      .update({ availability: avail })
      .in("id", ids);
    if (!error) updated += ids.length;
  }
  return updated;
}
