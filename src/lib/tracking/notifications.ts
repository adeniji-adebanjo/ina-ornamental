// ============================================================================
// Which shipment email (if any) a change to an order should trigger
// ============================================================================
// Kept as a pure decision so the rules are testable without a mail transport,
// and so the precedence between the email kinds is stated in one place.

import type { ShipmentStatus } from "@/types/database";

/** How long to sit on a waybill correction while an admin is still editing. */
export const WAYBILL_NOTICE_COOLDOWN_MS = 10 * 60_000; // 10 minutes

export interface ShipmentSnapshot {
  manual_status: ShipmentStatus | null;
  awb_number: string | null;
}

/** What the customer has actually been told, and when. */
export interface NotifiedState {
  awb_notified_value: string | null;
  awb_notified_at: string | null; // ISO timestamp
}

export type ShipmentNotification =
  /** The shipment reached a new stage. That email carries the current waybill. */
  | { kind: "stage"; stage: ShipmentStatus }
  /**
   * The waybill the customer holds is out of date. `previousAwb` is what they
   * were actually told last — not merely the prior column value.
   */
  | { kind: "waybill_corrected"; previousAwb: string | null }
  /**
   * A correction is owed but we're inside the cooldown, so it's held back.
   * The next write after `retryAfterMs` flushes it with whatever the waybill
   * says by then — so rapid edits collapse into one email, not none.
   */
  | { kind: "waybill_deferred"; retryAfterMs: number }
  | null;

/**
 * Decide what to send after an order update.
 *
 * - A genuine stage advance always wins: that email already carries the current
 *   waybill, so a simultaneous waybill edit must not also send a correction.
 * - A waybill only notifies once the customer has been told about this shipment
 *   at all (i.e. a stage has been set). Before that, recording a waybill is
 *   silent — that's the data-entry path where typos get caught.
 * - Clearing a waybill never emails: "your waybill is gone" alarms the customer
 *   without telling them anything useful.
 * - Corrections are compared against what was last *communicated*, so a change
 *   deferred during the cooldown is still owed and gets flushed later. That is
 *   what makes suppression safe: nothing is dropped, only delayed.
 */
export function decideShipmentNotification(
  before: ShipmentSnapshot,
  after: ShipmentSnapshot,
  notified: NotifiedState = { awb_notified_value: null, awb_notified_at: null },
  opts: { now: number; cooldownMs?: number; force?: boolean } = {
    now: 0,
  },
): ShipmentNotification {
  if (after.manual_status && after.manual_status !== before.manual_status) {
    return { kind: "stage", stage: after.manual_status };
  }

  // Nothing to correct until the shipment has been announced, and never on a
  // cleared waybill.
  if (!after.manual_status || !after.awb_number) return null;

  // Owed if what they hold differs from what the order now says.
  if (after.awb_number === notified.awb_notified_value) return null;

  const cooldownMs = opts.cooldownMs ?? WAYBILL_NOTICE_COOLDOWN_MS;
  const lastSentAt = notified.awb_notified_at
    ? Date.parse(notified.awb_notified_at)
    : NaN;

  if (!opts.force && Number.isFinite(lastSentAt)) {
    const elapsed = opts.now - lastSentAt;
    if (elapsed < cooldownMs) {
      return { kind: "waybill_deferred", retryAfterMs: cooldownMs - elapsed };
    }
  }

  return {
    kind: "waybill_corrected",
    previousAwb: notified.awb_notified_value,
  };
}
