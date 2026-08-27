import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import {
  sendOrderStatusUpdate,
  sendShipmentUpdate,
  sendWaybillCorrection,
} from "@/lib/email";
import { getAirlineTrackingUrl } from "@/lib/tracking/airlines";
import { decideShipmentNotification } from "@/lib/tracking/notifications";
import type { ShipmentSnapshot } from "@/lib/tracking/notifications";
import type { ShipmentStatus } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "BOOKED",
  "DEPARTED",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { status, awb_number, manual_status } = body as {
    status?: string;
    awb_number?: string | null;
    manual_status?: string | null;
  };

  const validStatuses = [
    "draft",
    "submitted",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status "${status}". Must be one of: ${validStatuses.join(", ")}.` },
      { status: 400 },
    );
  }

  // Only send the keys the caller actually supplied — a PATCH that just sets an
  // AWB must not blank the order status (and vice versa).
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;

  if (awb_number !== undefined) {
    const raw = typeof awb_number === "string" ? awb_number.trim() : "";
    if (!raw) {
      // Clearing the waybill clears the carrier fields derived from it.
      updates.awb_number = null;
      updates.carrier_prefix = null;
      updates.airline_name = null;
    } else {
      const tracking = getAirlineTrackingUrl(raw);
      if (!tracking) {
        return NextResponse.json(
          { error: "An Air Waybill must be 11 digits — a 3-digit airline prefix plus an 8-digit serial (e.g. 071-12345678)." },
          { status: 400 },
        );
      }
      // Denormalize the carrier at write time so a historical order keeps the
      // airline it actually flew on, even if the prefix registry changes.
      updates.awb_number = tracking.formattedAwb;
      updates.carrier_prefix = tracking.prefix;
      updates.airline_name = tracking.airlineName;
    }
  }

  if (manual_status !== undefined) {
    if (manual_status === null || manual_status === "") {
      updates.manual_status = null;
    } else if (!SHIPMENT_STATUSES.includes(manual_status as ShipmentStatus)) {
      return NextResponse.json(
        { error: `Invalid shipment status "${manual_status}". Must be one of: ${SHIPMENT_STATUSES.join(", ")}.` },
        { status: 400 },
      );
    } else {
      updates.manual_status = manual_status;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 },
    );
  }

  const admin = await createAdminSupabaseClient();

  // Read the shipment fields before writing so we can tell a real change from a
  // re-save — the customer should get one email per actual change, not per click.
  const touchesShipment =
    updates.manual_status !== undefined || updates.awb_number !== undefined;
  let before: ShipmentSnapshot = { manual_status: null, awb_number: null };
  if (touchesShipment) {
    const { data: prior } = await admin
      .from("orders")
      .select("manual_status, awb_number")
      .eq("id", id)
      .maybeSingle();
    before = {
      manual_status: (prior?.manual_status as ShipmentStatus | null) ?? null,
      awb_number: (prior?.awb_number as string | null) ?? null,
    };
  }

  const { data, error } = await admin
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Shipment emails — the customer is kept informed without ever having to look
  // anything up. See decideShipmentNotification for which email wins when.
  if (data.email && touchesShipment) {
    const after: ShipmentSnapshot = {
      manual_status: data.manual_status ?? null,
      awb_number: data.awb_number ?? null,
    };
    const notification = decideShipmentNotification(before, after);

    if (notification?.kind === "stage") {
      sendShipmentUpdate({
        order_reference: data.order_reference,
        customer_name: data.customer_name,
        email: data.email,
        manual_status: notification.stage,
        awb_number: data.awb_number,
        airline_name: data.airline_name,
      }).catch(console.error);
    } else if (notification?.kind === "waybill_corrected" && after.awb_number) {
      sendWaybillCorrection({
        order_reference: data.order_reference,
        customer_name: data.customer_name,
        email: data.email,
        manual_status: after.manual_status as ShipmentStatus,
        awb_number: after.awb_number,
        airline_name: data.airline_name,
        previous_awb: notification.previousAwb,
      }).catch(console.error);
    }
  }

  // Send status update email if order has customer email
  if (data.email && status) {
    sendOrderStatusUpdate({
      order_reference: data.order_reference,
      customer_name: data.customer_name,
      email: data.email,
      status,
      awb_number: data.awb_number,
      airline_name: data.airline_name,
    }).catch(console.error);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { error } = await admin.from("orders").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
