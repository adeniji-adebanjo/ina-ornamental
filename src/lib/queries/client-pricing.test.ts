import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isPriceListLive } from "@/lib/queries/client-pricing";

const base = { active: true, valid_from: null, valid_until: null };
const at = (iso: string) => new Date(iso);

describe("isPriceListLive", () => {
  test("an active list with no dates is live", () => {
    assert.equal(isPriceListLive(base, at("2026-10-31T12:00:00Z")), true);
  });

  test("an inactive list is never live", () => {
    assert.equal(isPriceListLive({ ...base, active: false }, at("2026-10-31T12:00:00Z")), false);
  });

  test("a list isn't live before its start date", () => {
    const pl = { ...base, valid_from: "2026-11-01T00:00:00+00:00" };
    assert.equal(isPriceListLive(pl, at("2026-10-31T23:59:59Z")), false);
    assert.equal(isPriceListLive(pl, at("2026-11-01T00:00:00Z")), true);
  });

  test("a bare end date stays valid for that whole day", () => {
    // Admin picked "valid until 31 Oct" → stored as midnight UTC.
    const pl = { ...base, valid_until: "2026-10-31T00:00:00+00:00" };
    assert.equal(isPriceListLive(pl, at("2026-10-31T00:30:00Z")), true);
    assert.equal(isPriceListLive(pl, at("2026-10-31T23:59:59Z")), true);
    assert.equal(isPriceListLive(pl, at("2026-11-01T00:00:00Z")), false);
  });

  test("an end date with a time of day expires at that exact time", () => {
    const pl = { ...base, valid_until: "2026-10-31T15:00:00+00:00" };
    assert.equal(isPriceListLive(pl, at("2026-10-31T14:59:59Z")), true);
    assert.equal(isPriceListLive(pl, at("2026-10-31T15:00:00Z")), false);
  });
});
