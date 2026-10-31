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
