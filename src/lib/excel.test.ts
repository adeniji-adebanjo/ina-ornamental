import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parsePrice, normalizeAvailability, cellText } from "@/lib/excel";

describe("parsePrice", () => {
  test("passes numbers through", () => {
    assert.equal(parsePrice(12.5), 12.5);
    assert.equal(parsePrice(0), 0);
  });

  test("strips currency symbols and spaces", () => {
    assert.equal(parsePrice("$12.50"), 12.5);
    assert.equal(parsePrice(" $ 8 "), 8);
  });

  test("handles decimal comma (12,50)", () => {
    assert.equal(parsePrice("12,50"), 12.5);
  });

  test("handles thousands separators (1,250.00 and 1,250)", () => {
    assert.equal(parsePrice("1,250.00"), 1250);
    assert.equal(parsePrice("1,250"), 1250);
  });

  test("returns NaN for blank", () => {
    assert.ok(Number.isNaN(parsePrice("")));
    assert.ok(Number.isNaN(parsePrice("   ")));
  });

  test("known quirk: non-numeric strips to 0 (callers guard with > 0)", () => {
    // "abc" -> stripped to "" -> Number("") === 0. Documented so a future
    // change to reject garbage as NaN is a conscious decision.
    assert.equal(parsePrice("abc"), 0);
  });
});

describe("normalizeAvailability", () => {
  test("maps human labels to enum keys (case-insensitive)", () => {
    assert.equal(normalizeAvailability("In Stock"), "available");
    assert.equal(normalizeAvailability("available"), "available");
    assert.equal(normalizeAvailability("limited"), "limited_stock");
    assert.equal(normalizeAvailability("Sold Out"), "out_of_stock");
    assert.equal(normalizeAvailability("Seasonal"), "seasonal");
    assert.equal(normalizeAvailability("on request"), "on_request");
  });

  test("returns null for blank/unknown so existing data is never wiped", () => {
    assert.equal(normalizeAvailability(""), null);
    assert.equal(normalizeAvailability("nonsense"), null);
    assert.equal(normalizeAvailability(null), null);
  });
});

describe("cellText", () => {
  test("flattens primitives", () => {
    assert.equal(cellText(null), "");
    assert.equal(cellText("hello"), "hello");
    assert.equal(cellText(5), "5");
  });

  test("flattens rich text, formula results and hyperlink objects", () => {
    assert.equal(cellText({ richText: [{ text: "a" }, { text: "b" }] }), "ab");
    assert.equal(cellText({ result: 42 }), "42");
    assert.equal(cellText({ text: "link" }), "link");
  });
});
