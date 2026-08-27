import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  decideShipmentNotification,
  WAYBILL_NOTICE_COOLDOWN_MS,
  type NotifiedState,
  type ShipmentSnapshot,
} from "@/lib/tracking/notifications";

const snap = (
  manual_status: ShipmentSnapshot["manual_status"],
  awb_number: ShipmentSnapshot["awb_number"],
): ShipmentSnapshot => ({ manual_status, awb_number });

// Fixed clock — the suite must not depend on wall time.
const NOW = Date.parse("2026-08-22T12:00:00.000Z");
const at = (msAgo: number) => new Date(NOW - msAgo).toISOString();

const told = (value: string | null, msAgo: number): NotifiedState => ({
  awb_notified_value: value,
  awb_notified_at: at(msAgo),
});
const neverTold: NotifiedState = {
  awb_notified_value: null,
  awb_notified_at: null,
};

const OLD_COOLDOWN = WAYBILL_NOTICE_COOLDOWN_MS + 60_000;

describe("decideShipmentNotification — stage changes", () => {
  test("advancing to a new stage sends the stage email", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", "071-12345678"),
      snap("DEPARTED", "071-12345678"),
      told("071-12345678", 0),
      { now: NOW },
    );
    assert.deepEqual(result, { kind: "stage", stage: "DEPARTED" });
  });

  test("a stage advance ignores the cooldown entirely", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", 1_000),
      { now: NOW },
    );
    assert.deepEqual(result, { kind: "stage", stage: "DEPARTED" });
  });

  test("re-saving the same stage sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("ARRIVED", "071-12345678"),
        snap("ARRIVED", "071-12345678"),
        told("071-12345678", OLD_COOLDOWN),
        { now: NOW },
      ),
      null,
    );
  });

  test("clearing the stage sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("ARRIVED", "071-12345678"),
        snap(null, "071-12345678"),
        told("071-12345678", OLD_COOLDOWN),
        { now: NOW },
      ),
      null,
    );
  });
});

describe("decideShipmentNotification — waybill corrections", () => {
  test("correcting the waybill after the cooldown sends a correction naming what they were told", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", OLD_COOLDOWN),
      { now: NOW },
    );
    assert.deepEqual(result, {
      kind: "waybill_corrected",
      previousAwb: "071-12345678",
    });
  });

  test("recording a waybill before any stage is set stays silent", () => {
    assert.equal(
      decideShipmentNotification(
        snap(null, null),
        snap(null, "071-12345678"),
        neverTold,
        { now: NOW },
      ),
      null,
    );
  });

  test("clearing a waybill never emails", () => {
    assert.equal(
      decideShipmentNotification(
        snap("DEPARTED", "071-12345678"),
        snap("DEPARTED", null),
        told("071-12345678", OLD_COOLDOWN),
        { now: NOW },
      ),
      null,
    );
  });

  test("a waybill matching what the customer holds sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("DEPARTED", "071-12345678"),
        snap("DEPARTED", "071-12345678"),
        told("071-12345678", OLD_COOLDOWN),
        { now: NOW },
      ),
      null,
    );
  });
});

describe("decideShipmentNotification — cooldown", () => {
  test("a correction inside the cooldown is deferred, not dropped", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", 2 * 60_000),
      { now: NOW },
    );
    assert.equal(result?.kind, "waybill_deferred");
    assert.equal(
      result?.kind === "waybill_deferred" ? result.retryAfterMs : null,
      WAYBILL_NOTICE_COOLDOWN_MS - 2 * 60_000,
    );
  });

  test("a deferred correction is still owed on a later write, carrying the newest waybill", () => {
    // Edit #2 landed during the cooldown and was held; by the time anything
    // else touches the order the window has passed, so it goes out — with the
    // latest number, not the one that was deferred.
    const result = decideShipmentNotification(
      snap("DEPARTED", "176-87654321"),
      snap("DEPARTED", "235-11111117"),
      told("071-12345678", OLD_COOLDOWN),
      { now: NOW },
    );
    assert.deepEqual(result, {
      kind: "waybill_corrected",
      previousAwb: "071-12345678",
    });
  });

  test("force releases a held correction immediately", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", 30_000),
      { now: NOW, force: true },
    );
    assert.deepEqual(result, {
      kind: "waybill_corrected",
      previousAwb: "071-12345678",
    });
  });

  test("force still sends nothing when nothing is owed", () => {
    assert.equal(
      decideShipmentNotification(
        snap("DEPARTED", "071-12345678"),
        snap("DEPARTED", "071-12345678"),
        told("071-12345678", 30_000),
        { now: NOW, force: true },
      ),
      null,
    );
  });

  test("exactly at the cooldown boundary the correction is released", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", WAYBILL_NOTICE_COOLDOWN_MS),
      { now: NOW },
    );
    assert.equal(result?.kind, "waybill_corrected");
  });

  test("with no send ever recorded, a correction is not held back", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", null),
      snap("BOOKED", "071-12345678"),
      neverTold,
      { now: NOW },
    );
    assert.deepEqual(result, { kind: "waybill_corrected", previousAwb: null });
  });

  test("the cooldown length is configurable per call", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
      told("071-12345678", 5_000),
      { now: NOW, cooldownMs: 1_000 },
    );
    assert.equal(result?.kind, "waybill_corrected");
  });
});
