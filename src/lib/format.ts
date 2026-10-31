// Shared display formatters. Locale and time zone are pinned so server- and
// client-rendered output match (no hydration mismatches) and every admin sees
// the same dates regardless of their browser settings.

const LOCALE = "en-GB";
const TIME_ZONE = "Africa/Lagos";

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * Format a date for display, e.g. "3 Oct 2026". Returns `fallback` for empty
 * or unparseable input.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
  fallback = "—",
): string {
  if (value === null || value === undefined || value === "") return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    timeZone: TIME_ZONE,
  }).format(date);
}

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

/**
 * The calendar day (YYYY-MM-DD) a moment falls on in Lagos — for grouping by
 * day. `toISOString().slice(0, 10)` gives the UTC day, which puts orders
 * placed 00:00–01:00 Lagos time on the previous day.
 */
export function lagosDayKey(value: string | number | Date): string {
  return dayKeyFormat.format(value instanceof Date ? value : new Date(value));
}

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format an amount as US dollars, e.g. "$1,234.50" (or "$1,235" if whole). */
export function formatUSD(
  amount: number,
  { whole = false }: { whole?: boolean } = {},
): string {
  return (whole ? usd0 : usd2).format(Number.isFinite(amount) ? amount : 0);
}
