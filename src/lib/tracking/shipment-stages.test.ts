import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SHIPMENT_STAGES,
  getShipmentStage,
} from "@/lib/tracking/shipment-stages";
import type { ShipmentStatus } from "@/types/database";

// Every stage an admin can set must produce customer-facing copy — a stage with
// no entry here would silently send no email at all.
const ALL_STATUSES: ShipmentStatus[] = [
  "BOOKED",
  "DEPARTED",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
];

describe("SHIPMENT_STAGES", () => {
  test("covers every shipment status exactly once, in flight order", () => {
    assert.deepEqual(
      SHIPMENT_STAGES.map((s) => s.value),
      ALL_STATUSES,
    );
  });

  test("every stage carries a label, headline and message", () => {
    for (const stage of SHIPMENT_STAGES) {
      assert.ok(stage.label.length > 0, `${stage.value} label`);
      assert.ok(stage.headline.length > 0, `${stage.value} headline`);
      assert.ok(stage.message.length > 0, `${stage.value} message`);
    }
  });
});

describe("getShipmentStage", () => {
  test("resolves a known status", () => {
    assert.equal(getShipmentStage("IN_TRANSIT")?.label, "In Transit");
  });

  test("returns null for no status, so no email is attempted", () => {
    assert.equal(getShipmentStage(null), null);
    assert.equal(getShipmentStage(undefined), null);
  });
});
