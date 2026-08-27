// ============================================================================
// Shipment stages — the physical progress of an air freight consignment
// ============================================================================
// One definition shared by the admin controls, the tracking card, and the
// customer email, so a stage always reads the same wherever it appears.

import type { ShipmentStatus } from "@/types/database";

export interface ShipmentStage {
  value: ShipmentStatus;
  /** Short label for buttons, badges and progress rails. */
  label: string;
  /** Email subject line, written from the customer's point of view. */
  headline: string;
  /** Body sentence for the email. */
  message: string;
}

export const SHIPMENT_STAGES: ShipmentStage[] = [
  {
    value: "BOOKED",
    label: "Booked",
    headline: "Your shipment has been booked",
    message:
      "Your consignment has been booked with the airline and an Air Waybill has been issued.",
  },
  {
    value: "DEPARTED",
    label: "Departed",
    headline: "Your shipment has departed",
    message:
      "Your consignment has been handed over to the airline and has departed on its outbound flight.",
  },
  {
    value: "IN_TRANSIT",
    label: "In Transit",
    headline: "Your shipment is in transit",
    message:
      "Your consignment is currently in transit. You can follow the live flight status on the airline's cargo portal.",
  },
  {
    value: "ARRIVED",
    label: "Arrived",
    headline: "Your shipment has arrived",
    message:
      "Your consignment has arrived at the destination airport and is being processed for release.",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    headline: "Your shipment has been delivered",
    message:
      "Your consignment has been delivered. We hope your new arrivals settle in well — please let us know how they travelled.",
  },
];

export function getShipmentStage(
  status: ShipmentStatus | null | undefined,
): ShipmentStage | null {
  if (!status) return null;
  return SHIPMENT_STAGES.find((s) => s.value === status) ?? null;
}
