// ============================================================================
// Air Cargo Tracking — carrier registry + AWB deep-link builder
// ============================================================================
// Zero-cost tracking: instead of paying for a tracking API, we identify the
// carrier from the 3-digit IATA prefix of the Air Waybill and hand the client
// a direct link into that airline's own cargo portal.
//
// Some airlines accept the AWB as a query parameter (deep link — the portal
// opens on the shipment). Others only expose a landing page where the client
// has to paste the number themselves. `prefilled` tells the UI which case it
// is dealing with so it can offer a copy-to-clipboard fallback instead of
// implying a prefill that never happens.

/** IATA prefix → carrier. Keyed by the 3-digit AWB prefix. */
export interface AirCarrier {
  /** 3-digit IATA airline prefix, e.g. "071". */
  prefix: string;
  /** Full carrier name, used in copy: "Track on Official {name} Portal". */
  name: string;
  /**
   * Tracking URL. `{prefix}`, `{serial}` and `{awb}` (the hyphenated
   * "071-12345678" form) are substituted when present. A template with no
   * placeholder is a plain portal landing page — the client pastes the AWB.
   */
  urlTemplate: string;
}

// URLs verified against each carrier's live portal. None of the seven accept
// the waybill as a query parameter today, so every link lands on the tracking
// page and the customer enters the number — the UI and emails say so rather
// than implying a prefill that never happens. If a carrier later exposes a
// deep-link parameter, add the placeholders here and everything downstream
// (card, email copy, admin preview) follows automatically.
export const AIR_CARRIERS: Record<string, AirCarrier> = {
  "020": {
    prefix: "020",
    name: "Lufthansa Cargo",
    urlTemplate: "https://www.lufthansa-cargo.com/en/eservices/etracking",
  },
  "235": {
    prefix: "235",
    name: "Turkish Cargo",
    urlTemplate: "https://www.turkishcargo.com/en/cargo-tracking",
  },
  "071": {
    prefix: "071",
    name: "Ethiopian Cargo",
    urlTemplate:
      "https://ethiopiancargo.azurewebsites.net/my-cargo/track-your-shipment",
  },
  "157": {
    prefix: "157",
    name: "Qatar Airways Cargo",
    urlTemplate: "https://www.qrcargo.com/s/track-your-shipment",
  },
  "176": {
    prefix: "176",
    name: "Emirates SkyCargo",
    urlTemplate:
      "https://eskycargo.emirates.com/app/offerandorder/#/home/find-offer",
  },
  "006": {
    prefix: "006",
    name: "Delta Cargo",
    urlTemplate: "https://www.deltacargo.com/Cargo/trackShipment",
  },
  "706": {
    prefix: "706",
    name: "Kenya Airways Cargo",
    urlTemplate: "https://www.kqcargo.com/en/#4",
  },
};

export interface AirlineTracking {
  /** Carrier name, or null when the prefix isn't one we ship with. */
  airlineName: string | null;
  /** The 3-digit prefix as entered, e.g. "071". */
  prefix: string;
  /** The 8-digit serial (7 digits + check digit). */
  serial: string;
  /** Canonical display form: "071-12345678". */
  formattedAwb: string;
  /** Deep link into the carrier portal, or null for an unknown prefix. */
  trackingUrl: string | null;
  /** True when the AWB travels in the URL; false for paste-it-yourself portals. */
  prefilled: boolean;
  /** IATA modulus-7 check digit result — a cheap typo guard for data entry. */
  checkDigitValid: boolean;
}

// Matched with .match()/.replace() rather than .test() — a global regex keeps
// lastIndex between .test() calls, which would make detection alternate.
const AWB_PLACEHOLDER = /\{(prefix|serial|awb)\}/g;

/**
 * Substitute the waybill parts into a carrier URL template, reporting whether
 * the template carried the waybill at all. Every occurrence is replaced, so a
 * template may reference a placeholder more than once.
 */
export function applyAwbTemplate(
  template: string,
  parts: { prefix: string; serial: string; formattedAwb: string },
): { url: string; prefilled: boolean } {
  const values: Record<string, string> = {
    prefix: parts.prefix,
    serial: parts.serial,
    awb: parts.formattedAwb,
  };
  return {
    url: template.replace(AWB_PLACEHOLDER, (_match, key: string) =>
      encodeURIComponent(values[key]),
    ),
    prefilled: template.match(AWB_PLACEHOLDER) !== null,
  };
}

/** Strip formatting (spaces, hyphens, dots) down to bare digits. */
export function normalizeAwb(awb: string): string {
  return awb.replace(/\D/g, "");
}

/**
 * IATA check digit: the last digit of the 8-digit serial equals the preceding
 * 7 digits modulo 7. Catches most transposed/mistyped AWBs at entry time.
 */
export function isCheckDigitValid(awb: string): boolean {
  const digits = normalizeAwb(awb);
  if (digits.length !== 11) return false;
  const serial = digits.slice(3);
  return Number(serial.slice(0, 7)) % 7 === Number(serial[7]);
}

/**
 * Resolve an Air Waybill to its carrier and a ready-to-open tracking link.
 *
 * Returns null when the input isn't a usable AWB (an AWB is exactly 11 digits:
 * a 3-digit airline prefix plus an 8-digit serial). A recognised shape with an
 * unrecognised prefix still returns a result — with `airlineName` and
 * `trackingUrl` null — so the UI can show the number without inventing a link.
 */
export function getAirlineTrackingUrl(awb: string): AirlineTracking | null {
  const digits = normalizeAwb(awb ?? "");
  if (digits.length !== 11) return null;

  const prefix = digits.slice(0, 3);
  const serial = digits.slice(3);
  const formattedAwb = `${prefix}-${serial}`;
  const carrier = AIR_CARRIERS[prefix];

  if (!carrier) {
    return {
      airlineName: null,
      prefix,
      serial,
      formattedAwb,
      trackingUrl: null,
      prefilled: false,
      checkDigitValid: isCheckDigitValid(digits),
    };
  }

  const { url: trackingUrl, prefilled } = applyAwbTemplate(
    carrier.urlTemplate,
    { prefix, serial, formattedAwb },
  );

  return {
    airlineName: carrier.name,
    prefix,
    serial,
    formattedAwb,
    trackingUrl,
    prefilled,
    checkDigitValid: isCheckDigitValid(digits),
  };
}
