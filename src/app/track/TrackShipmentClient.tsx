"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShipmentTrackingCard } from "@/components/order/ShipmentTrackingCard";
import type { OrderStatus, ShipmentStatus } from "@/types/database";

interface TrackedOrder {
  order_reference: string;
  customer_name: string;
  status: OrderStatus;
  awb_number: string | null;
  airline_name: string | null;
  manual_status: ShipmentStatus | null;
}

export default function TrackShipmentClient() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setOrder(data as TrackedOrder);
      } else {
        setError(data?.error || "We couldn't look that order up. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl">
        <CardContent className="px-4 sm:px-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="track-reference"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Order reference
              </label>
              <Input
                id="track-reference"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="INA-20260819-417"
                className="h-10 rounded-xl font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="track-email"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                Email used to order
              </label>
              <Input
                id="track-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl text-sm font-semibold"
            >
              <Search className="size-4" />
              {loading ? "Looking up…" : "Track shipment"}
            </Button>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {order && (
        <ShipmentTrackingCard
          orderReference={order.order_reference}
          awbNumber={order.awb_number}
          airlineName={order.airline_name}
          manualStatus={order.manual_status}
        />
      )}

      {order && !order.awb_number && (
        <p className="text-center text-xs text-slate-500">
          Order status: <span className="font-semibold">{order.status}</span> —
          we&apos;ll email you as soon as the waybill is issued.
        </p>
      )}
    </div>
  );
}
