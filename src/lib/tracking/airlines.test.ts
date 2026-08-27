import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  AIR_CARRIERS,
  applyAwbTemplate,
  getAirlineTrackingUrl,
  isCheckDigitValid,
  normalizeAwb,
} from "@/lib/tracking/airlines";

describe("normalizeAwb", () => {
  test("strips hyphens, spaces and stray punctuation", () => {
    assert.equal(normalizeAwb(" 071-1234 5678 "), "07112345678");
    assert.equal(normalizeAwb("071.12345678"), "07112345678");
  });
});

describe("isCheckDigitValid", () => {
  test("accepts a serial whose last digit is the first seven mod 7", () => {
    assert.equal(1234567 % 7, 5);
    assert.equal(isCheckDigitValid("071-12345675"), true);
  });

  test("rejects a mistyped check digit", () => {
    assert.equal(isCheckDigitValid("071-12345678"), false);
  });

  test("rejects anything that isn't 11 digits", () => {
    assert.equal(isCheckDigitValid("071-1234"), false);
  });
});

describe("getAirlineTrackingUrl", () => {
  test("returns null for input that can't be an AWB", () => {
    assert.equal(getAirlineTrackingUrl(""), null);
    assert.equal(getAirlineTrackingUrl("071-1234"), null); // too short
    assert.equal(getAirlineTrackingUrl("071-123456789"), null); // too long
  });

  test("parses a messily-formatted waybill into its parts", () => {
    const result = getAirlineTrackingUrl("176 1234 5678");
    assert.ok(result);
    assert.equal(result.airlineName, "Emirates SkyCargo");
    assert.equal(result.prefix, "176");
    assert.equal(result.serial, "12345678");
    assert.equal(result.formattedAwb, "176-12345678");
  });

  test("flags portal-only carriers as not prefilled and leaves the URL bare", () => {
    const result = getAirlineTrackingUrl("071-12345678");
    assert.ok(result);
    assert.equal(result.airlineName, "Ethiopian Cargo");
    assert.equal(result.prefilled, false);
    assert.equal(
      result.trackingUrl,
      "https://ethiopiancargo.azurewebsites.net/my-cargo/track-your-shipment",
    );
  });

  // No carrier currently accepts the waybill in a URL, so every registered
  // portal must report prefilled:false — otherwise the UI would promise a
  // prefill the airline doesn't do.
  test("no registered carrier claims to prefill the waybill", () => {
    for (const prefix of Object.keys(AIR_CARRIERS)) {
      const result = getAirlineTrackingUrl(`${prefix}12345678`);
      assert.equal(result?.prefilled, false, `${prefix} prefilled`);
    }
  });

  test("formats an unknown prefix without inventing a link", () => {
    const result = getAirlineTrackingUrl("999-12345678");
    assert.ok(result);
    assert.equal(result.airlineName, null);
    assert.equal(result.trackingUrl, null);
    assert.equal(result.prefilled, false);
    assert.equal(result.formattedAwb, "999-12345678");
  });

  test("every registered carrier resolves to an https URL", () => {
    for (const prefix of Object.keys(AIR_CARRIERS)) {
      const result = getAirlineTrackingUrl(`${prefix}12345678`);
      assert.ok(result, `${prefix} should resolve`);
      assert.equal(result.airlineName, AIR_CARRIERS[prefix].name);
      assert.match(result.trackingUrl ?? "", /^https:\/\//);
      assert.doesNotMatch(result.trackingUrl ?? "", /\{|\}/);
    }
  });

  test("registry keys and carrier prefixes stay in sync", () => {
    for (const [key, carrier] of Object.entries(AIR_CARRIERS)) {
      assert.equal(key, carrier.prefix);
      assert.match(key, /^\d{3}$/);
    }
  });
});

describe("applyAwbTemplate", () => {
  const parts = {
    prefix: "071",
    serial: "12345678",
    formattedAwb: "071-12345678",
  };

  test("a template with no placeholder is left alone and reports no prefill", () => {
    const result = applyAwbTemplate("https://example.com/track", parts);
    assert.equal(result.url, "https://example.com/track");
    assert.equal(result.prefilled, false);
  });

  test("substitutes each placeholder and reports a prefill", () => {
    const result = applyAwbTemplate(
      "https://example.com/t?p={prefix}&s={serial}&a={awb}",
      parts,
    );
    assert.equal(
      result.url,
      "https://example.com/t?p=071&s=12345678&a=071-12345678",
    );
    assert.equal(result.prefilled, true);
  });

  test("replaces every occurrence, not just the first", () => {
    const result = applyAwbTemplate("https://x.test/{awb}/detail/{awb}", parts);
    assert.equal(result.url, "https://x.test/071-12345678/detail/071-12345678");
  });

  test("detection is stable across repeated calls", () => {
    // A global regex used with .test() would alternate true/false here.
    const template = "https://example.com/t?a={awb}";
    for (let i = 0; i < 4; i++) {
      assert.equal(applyAwbTemplate(template, parts).prefilled, true);
    }
  });
});
