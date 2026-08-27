// ============================================================================
// Which shipment email (if any) a change to an order should trigger
// ============================================================================
// Kept as a pure decision so the rules are testable without a mail transport,
// and so the precedence between the two email kinds is stated in one place.

import type { ShipmentStatus } from "@/types/database";

export interface ShipmentSnapshot {
  manual_status: ShipmentStatus | null;
  awb_number: string | null;
}

export type ShipmentNotification =
  /** The shipment reached a new stage. Carries the current waybill. */
  | { kind: "stage"; stage: ShipmentStatus }
  /** The waybill changed on a shipment the customer was already told about. */
  | { kind: "waybill_corrected"; previousAwb: string | null }
  | null;

/**
 * Decide what to send after an order update.
 *
 * - A genuine stage advance always wins: that email already carries the current
 *   waybill, so a simultaneous waybill edit must not also send a correction.
 * - A waybill change only notifies once the customer has been told about this
 *   shipment at all (i.e. a stage has been set). Before that, there is nothing
 *   to correct — recording a waybill is silent.
 * - Clearing a waybill never emails: "your waybill is gone" alarms the customer
 *   without telling them anything useful. Admin can re-save the correct number.
 */
export function decideShipmentNotification(
  before: ShipmentSnapshot,
  after: ShipmentSnapshot,
): ShipmentNotification {
  if (after.manual_status && after.manual_status !== before.manual_status) {
    return { kind: "stage", stage: after.manual_status };
  }

  const awbChanged = (after.awb_number ?? null) !== (before.awb_number ?? null);
  if (awbChanged && after.awb_number && after.manual_status) {
    return { kind: "waybill_corrected", previousAwb: before.awb_number };
  }

  return null;
}
