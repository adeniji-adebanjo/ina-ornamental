import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  decideShipmentNotification,
  type ShipmentSnapshot,
} from "@/lib/tracking/notifications";

const snap = (
  manual_status: ShipmentSnapshot["manual_status"],
  awb_number: ShipmentSnapshot["awb_number"],
): ShipmentSnapshot => ({ manual_status, awb_number });

describe("decideShipmentNotification — stage changes", () => {
  test("advancing to a new stage sends the stage email", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", "071-12345678"),
      snap("DEPARTED", "071-12345678"),
    );
    assert.deepEqual(result, { kind: "stage", stage: "DEPARTED" });
  });

  test("the first stage ever set sends the stage email", () => {
    const result = decideShipmentNotification(
      snap(null, "071-12345678"),
      snap("BOOKED", "071-12345678"),
    );
    assert.deepEqual(result, { kind: "stage", stage: "BOOKED" });
  });

  test("re-saving the same stage sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("ARRIVED", "071-12345678"),
        snap("ARRIVED", "071-12345678"),
      ),
      null,
    );
  });

  test("clearing the stage sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("ARRIVED", "071-12345678"),
        snap(null, "071-12345678"),
      ),
      null,
    );
  });
});

describe("decideShipmentNotification — waybill corrections", () => {
  test("correcting the waybill after the customer was notified sends a correction", () => {
    const result = decideShipmentNotification(
      snap("DEPARTED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
    );
    assert.deepEqual(result, {
      kind: "waybill_corrected",
      previousAwb: "071-12345678",
    });
  });

  test("adding a waybill to an already-notified shipment sends a correction", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", null),
      snap("BOOKED", "071-12345678"),
    );
    assert.deepEqual(result, {
      kind: "waybill_corrected",
      previousAwb: null,
    });
  });

  test("recording a waybill before any stage is set stays silent", () => {
    assert.equal(
      decideShipmentNotification(snap(null, null), snap(null, "071-12345678")),
      null,
    );
  });

  test("clearing a waybill never emails", () => {
    assert.equal(
      decideShipmentNotification(
        snap("DEPARTED", "071-12345678"),
        snap("DEPARTED", null),
      ),
      null,
    );
  });

  test("an unchanged waybill sends nothing", () => {
    assert.equal(
      decideShipmentNotification(
        snap("DEPARTED", "071-12345678"),
        snap("DEPARTED", "071-12345678"),
      ),
      null,
    );
  });
});

describe("decideShipmentNotification — precedence", () => {
  test("a stage advance wins over a simultaneous waybill change, so only one email goes out", () => {
    const result = decideShipmentNotification(
      snap("BOOKED", "071-12345678"),
      snap("DEPARTED", "176-87654321"),
    );
    assert.deepEqual(result, { kind: "stage", stage: "DEPARTED" });
  });
});
