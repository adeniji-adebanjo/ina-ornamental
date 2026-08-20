import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  AIR_CARRIERS,
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

  test("builds a prefilled deep link for carriers that accept an AWB param", () => {
    const result = getAirlineTrackingUrl("176 1234 5678");
    assert.ok(result);
    assert.equal(result.airlineName, "Emirates SkyCargo");
    assert.equal(result.prefix, "176");
    assert.equal(result.serial, "12345678");
    assert.equal(result.formattedAwb, "176-12345678");
    assert.equal(
      result.trackingUrl,
      "https://www.skycargo.com/tracking?awb=176-12345678",
    );
    assert.equal(result.prefilled, true);
  });

  test("flags portal-only carriers as not prefilled and leaves the URL bare", () => {
    const result = getAirlineTrackingUrl("071-12345678");
    assert.ok(result);
    assert.equal(result.airlineName, "Ethiopian Cargo");
    assert.equal(result.prefilled, false);
    assert.equal(
      result.trackingUrl,
      "https://www.cargo.ethiopianairlines.com/tracking",
    );
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
