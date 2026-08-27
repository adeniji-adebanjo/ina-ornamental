"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Plane,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAirlineTrackingUrl } from "@/lib/tracking/airlines";
import type { ShipmentStatus } from "@/types/database";
import { cn } from "@/lib/utils";

import { SHIPMENT_STAGES } from "@/lib/tracking/shipment-stages";

export interface ShipmentTrackingCardProps {
  /** Human-facing order reference, e.g. "INA-20260819-417". */
  orderReference: string;
  /** Air Waybill as recorded on the order; any format the helper can parse. */
  awbNumber: string | null | undefined;
  /**
   * Airline stored on the order. Wins over the prefix lookup so a historical
   * order keeps the carrier it actually flew on.
   */
  airlineName?: string | null;
  /** Physical shipment progress. */
  manualStatus?: ShipmentStatus | null;
  className?: string;
}

export function ShipmentTrackingCard({
  orderReference,
  awbNumber,
  airlineName,
  manualStatus,
  className,
}: ShipmentTrackingCardProps) {
  const [copied, setCopied] = useState(false);
  const tracking = useMemo(
    () => (awbNumber ? getAirlineTrackingUrl(awbNumber) : null),
    [awbNumber],
  );

  // No AWB yet (or an unparseable one) — say so plainly rather than rendering a
  // dead tracking card.
  if (!tracking) {
    return (
      <Card className={cn("rounded-2xl", className)}>
        <CardContent className="px-4 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Shipment tracking
          </p>
          <h3 className="mt-1 font-bold text-slate-900">{orderReference}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Your Air Waybill will appear here as soon as the shipment is booked
            with the airline.
          </p>
        </CardContent>
      </Card>
    );
  }

  const carrier = airlineName || tracking.airlineName;
  const stageIndex = manualStatus
    ? SHIPMENT_STAGES.findIndex((s) => s.value === manualStatus)
    : -1;

  async function copyAwb() {
    if (!tracking) return;
    try {
      await navigator.clipboard.writeText(tracking.formattedAwb);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the number is on screen to copy by hand */
    }
  }

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardContent className="px-4 sm:px-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Shipment tracking
            </p>
            <h3 className="mt-0.5 truncate text-lg font-bold text-slate-900">
              {orderReference}
            </h3>
          </div>
          {manualStatus && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
              {manualStatus === "DELIVERED" ? (
                <PackageCheck className="size-3.5" />
              ) : (
                <Plane className="size-3.5" />
              )}
              {SHIPMENT_STAGES.find((s) => s.value === manualStatus)?.label ??
                manualStatus}
            </span>
          )}
        </div>

        {/* Progress rail */}
        {stageIndex >= 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {SHIPMENT_STAGES.map((stage, i) => (
                <div
                  key={stage.value}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i <= stageIndex ? "bg-sky-700" : "bg-slate-200",
                  )}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between gap-1">
              {SHIPMENT_STAGES.map((stage, i) => (
                <span
                  key={stage.value}
                  className={cn(
                    "text-[10px] font-medium",
                    i <= stageIndex ? "text-sky-800" : "text-slate-400",
                  )}
                >
                  {stage.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Air Waybill
            </dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-900">
                {tracking.formattedAwb}
              </span>
              <button
                type="button"
                onClick={copyAwb}
                className="inline-flex size-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={copied ? "AWB copied" : "Copy AWB number"}
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Airline
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">
              {carrier ?? "Carrier not identified"}
            </dd>
          </div>
        </dl>

        {/* CTA */}
        {tracking.trackingUrl ? (
          <>
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              <ExternalLink className="size-4" />
              Track on Official {carrier} Portal
            </a>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
              <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
              <span>
                Clicking this button redirects you directly to live flight
                status updates on the airline portal.
                {!tracking.prefilled && (
                  <>
                    {" "}
                    {carrier} doesn&apos;t accept the waybill in the link, so
                    paste{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {tracking.formattedAwb}
                    </span>{" "}
                    into their tracking box — use the copy button above.
                  </>
                )}
              </span>
            </p>
          </>
        ) : (
          <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            <span>
              We don&apos;t have a tracking portal on file for airline prefix{" "}
              <span className="font-mono font-semibold text-slate-700">
                {tracking.prefix}
              </span>
              . Contact us with your waybill number and we&apos;ll send you the
              latest flight status.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ShipmentTrackingCard;
