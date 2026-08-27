"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, ExternalLink, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAirlineTrackingUrl } from "@/lib/tracking/airlines";
import { SHIPMENT_STAGES } from "@/lib/tracking/shipment-stages";
import type { OrderWithGroups } from "@/types/database";

export default function ShipmentTrackingEditor({
  order,
  onSaved,
}: {
  order: OrderWithGroups;
  onSaved: () => void;
}) {
  const [awb, setAwb] = useState(order.awb_number ?? "");
  const [saving, setSaving] = useState(false);

  // Live carrier detection as the AWB is typed — the same resolver the client
  // card and the API use, so what admin sees is what the client gets.
  const tracking = useMemo(
    () => (awb.trim() ? getAirlineTrackingUrl(awb) : null),
    [awb],
  );
  const dirty = (order.awb_number ?? "") !== awb.trim();

  async function patch(payload: Record<string, unknown>, message: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(message);
      onSaved();
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Couldn't save the tracking details.");
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Plane className="size-3.5" />
        Air cargo tracking
      </p>

      {/* AWB entry */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder="Air Waybill — e.g. 071-12345678"
            className="rounded-lg font-mono text-sm"
          />
          <div className="mt-1.5 min-h-4 text-xs">
            {!awb.trim() ? (
              <span className="text-slate-400">
                3-digit airline prefix + 8-digit serial.
              </span>
            ) : !tracking ? (
              <span className="text-amber-600">
                Needs exactly 11 digits — keep typing.
              </span>
            ) : !tracking.airlineName ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="size-3" />
                Prefix {tracking.prefix} isn&apos;t a carrier we have on file —
                the client won&apos;t get a portal link.
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-emerald-700">
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3" />
                  {tracking.airlineName} · {tracking.formattedAwb}
                </span>
                {!tracking.checkDigitValid && (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="size-3" />
                    check digit looks wrong — verify the number
                  </span>
                )}
                {tracking.trackingUrl && (
                  <a
                    href={tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-700 underline underline-offset-2"
                  >
                    <ExternalLink className="size-3" />
                    preview portal
                  </a>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="rounded-lg text-xs"
            disabled={saving || !dirty || (awb.trim() !== "" && !tracking)}
            onClick={() =>
              patch(
                { awb_number: awb.trim() },
                // A waybill change only notifies once the customer has already
                // been told about this shipment.
                order.manual_status
                  ? `Waybill saved — correction sent to ${order.email}`
                  : "Waybill saved",
              )
            }
          >
            Save AWB
          </Button>
          {order.awb_number && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg text-xs"
              disabled={saving}
              onClick={() => {
                setAwb("");
                patch({ awb_number: null }, "Waybill cleared");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Shipment stage */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
        <p className="mr-1 text-xs font-medium text-slate-500">Shipment:</p>
        {SHIPMENT_STAGES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={order.manual_status === s.value ? "default" : "outline"}
            className="rounded-lg text-xs"
            disabled={saving || order.manual_status === s.value}
            onClick={() =>
              patch(
                { manual_status: s.value },
                `Marked ${s.label} — ${order.email} notified`,
              )
            }
          >
            {s.label}
          </Button>
        ))}
        {order.manual_status && (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg text-xs text-slate-500"
            disabled={saving}
            onClick={() => patch({ manual_status: null }, "Shipment stage cleared")}
          >
            Clear
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Setting a stage emails the customer automatically with the waybill and a
        direct link to the airline&apos;s tracking portal. Save the waybill
        first so it&apos;s included.{" "}
        {order.manual_status
          ? "This shipment has been announced, so changing the waybill now sends a correction."
          : "Recording a waybill before the first stage is silent."}
      </p>
    </div>
  );
}
