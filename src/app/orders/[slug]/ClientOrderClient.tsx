"use client";

import { useState } from "react";
import type { ClientPriceListWithItems } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, MessageCircle } from "lucide-react";

interface OrderGroup {
  id: number;
  name: string;
  items: Record<string, { quantity: number; size: string }>;
}

export default function ClientOrderClient({
  priceList,
}: {
  priceList: ClientPriceListWithItems;
}) {
  const [groups, setGroups] = useState<OrderGroup[]>([
    { id: 1, name: "Order A", items: {} },
  ]);
  const [activeGroupId, setActiveGroupId] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  const activeGroup = groups.find((g) => g.id === activeGroupId)!;

  function updateQty(speciesId: string, delta: number) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== activeGroupId) return g;
        const current = g.items[speciesId]?.quantity ?? 0;
        const newQty = Math.max(0, current + delta);
        if (newQty === 0) {
          const { [speciesId]: _, ...rest } = g.items;
          return { ...g, items: rest };
        }
        return {
          ...g,
          items: {
            ...g.items,
            [speciesId]: {
              quantity: newQty,
              size: g.items[speciesId]?.size ?? "",
            },
          },
        };
      }),
    );
  }

  function setQty(speciesId: string, qty: number) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== activeGroupId) return g;
        if (qty <= 0) {
          const { [speciesId]: _, ...rest } = g.items;
          return { ...g, items: rest };
        }
        return {
          ...g,
          items: {
            ...g.items,
            [speciesId]: {
              quantity: qty,
              size: g.items[speciesId]?.size ?? "",
            },
          },
        };
      }),
    );
  }

  function addGroup() {
    const id = Date.now();
    const name = `Order ${String.fromCharCode(65 + groups.length)}`;
    setGroups((prev) => [...prev, { id, name, items: {} }]);
    setActiveGroupId(id);
  }

  function removeGroup(id: number) {
    if (groups.length <= 1) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeGroupId === id) {
      setActiveGroupId(groups.find((g) => g.id !== id)!.id);
    }
  }

  const totalItems = groups.reduce(
    (sum, g) =>
      sum + Object.values(g.items).reduce((s, i) => s + i.quantity, 0),
    0,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (totalItems === 0) return;
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const orderGroups = groups
      .filter((g) => Object.keys(g.items).length > 0)
      .map((g) => ({
        name: g.name,
        items: Object.entries(g.items).map(
          ([speciesId, { quantity, size }]) => {
            const priceItem = priceList.items.find(
              (pi) => pi.species_id === speciesId,
            );
            return {
              species_id: speciesId,
              species_name: priceItem?.species?.common_name ?? "",
              scientific_name: priceItem?.species?.scientific_name ?? "",
              size,
              quantity,
              unit_price: priceItem?.custom_price ?? null,
            };
          },
        ),
      }));

    const body = {
      customer_name: formData.get("customer_name"),
      company_name: formData.get("company_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      country: formData.get("country"),
      delivery_address: formData.get("delivery_address"),
      notes: formData.get("notes"),
      price_list_id: priceList.id,
      client_id: priceList.client_id,
      groups: orderGroups,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderRef(data.order_reference);
        setSubmitted(true);
        toast.success("Order submitted!", {
          description: `Reference: ${data.order_reference}`,
        });
      } else {
        toast.error("Failed to submit order");
      }
    } catch {
      toast.error("Network error");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="size-7 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Order Submitted
            </h2>
            <p className="text-slate-600 mt-2">
              Reference: <strong className="font-mono">{orderRef}</strong>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Our team will contact you shortly with confirmation and shipping
              details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-sky-800">
              iNA Ornamental Fish
            </h1>
            <p className="text-xs text-slate-500">{priceList.title}</p>
          </div>
          <Badge variant="outline" className="text-emerald-700">
            {totalItems} items selected
          </Badge>
        </div>
      </header>

      {/* Order Group Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                g.id === activeGroupId
                  ? "bg-sky-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {g.name}
              {Object.keys(g.items).length > 0 && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({Object.values(g.items).reduce((s, i) => s + i.quantity, 0)})
                </span>
              )}
            </button>
          ))}
          <button
            onClick={addGroup}
            className="px-3 py-2 rounded-full text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            + New Group
          </button>
          {groups.length > 1 && (
            <button
              onClick={() => removeGroup(activeGroupId)}
              className="px-3 py-2 rounded-full text-sm text-red-500 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Species Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {priceList.items.map((item) => {
                const sp = item.species;
                if (!sp) return null;
                const qty = activeGroup.items[item.species_id]?.quantity ?? 0;
                const mainImg =
                  sp.images?.[0]?.image_url ?? "/images/fish-placeholder.svg";

                return (
                  <Card key={item.id} className="rounded-xl overflow-hidden">
                    <div className="h-40 bg-slate-100 overflow-hidden">
                      <img
                        src={mainImg}
                        alt={sp.common_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900">
                        {sp.common_name}
                      </h3>
                      <p className="text-sm italic text-slate-500">
                        {sp.scientific_name}
                      </p>
                      <p className="text-lg font-bold text-sky-800 mt-1">
                        ${Number(item.custom_price).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQty(item.species_id, -1)}
                          disabled={qty === 0}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) =>
                            setQty(
                              item.species_id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-20 text-center rounded-lg h-9"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQty(item.species_id, 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Form */}
          <div>
            <Card className="rounded-xl sticky top-[130px]">
              <CardContent className="p-5">
                <h2 className="font-bold text-slate-900 text-lg mb-4">
                  Order Summary
                </h2>

                {totalItems === 0 ? (
                  <p className="text-sm text-slate-500">
                    Select species and quantities to build your order.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                      {groups.map((g) =>
                        Object.entries(g.items).map(
                          ([speciesId, { quantity }]) => {
                            const pi = priceList.items.find(
                              (i) => i.species_id === speciesId,
                            );
                            return (
                              <div
                                key={`${g.id}-${speciesId}`}
                                className="flex justify-between text-sm py-1 border-b border-slate-50"
                              >
                                <span className="truncate flex-1">
                                  <span className="text-xs text-slate-400">
                                    [{g.name}]
                                  </span>{" "}
                                  {pi?.species?.common_name}
                                </span>
                                <span className="font-medium ml-2">
                                  x{quantity}
                                </span>
                              </div>
                            );
                          },
                        ),
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        required
                        name="customer_name"
                        placeholder="Full Name"
                        defaultValue={priceList.client?.name ?? ""}
                        className="rounded-xl h-10"
                      />
                      <Input
                        name="company_name"
                        placeholder="Company Name"
                        defaultValue={priceList.client?.company ?? ""}
                        className="rounded-xl h-10"
                      />
                      <Input
                        required
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        defaultValue={priceList.client?.email ?? ""}
                        className="rounded-xl h-10"
                      />
                      <Input
                        name="phone"
                        placeholder="Phone"
                        defaultValue={priceList.client?.phone ?? ""}
                        className="rounded-xl h-10"
                      />
                      <Input
                        name="country"
                        placeholder="Country"
                        defaultValue={priceList.client?.country ?? ""}
                        className="rounded-xl h-10"
                      />
                      <Input
                        name="delivery_address"
                        placeholder="Delivery Address"
                        className="rounded-xl h-10"
                      />
                      <Textarea
                        name="notes"
                        placeholder="Additional notes..."
                        rows={3}
                        className="rounded-xl"
                      />
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl font-semibold"
                      >
                        {submitting ? "Submitting..." : "Submit Order"}
                      </Button>
                    </form>
                  </>
                )}

                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348168850307"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="size-4" />
                  Contact via WhatsApp
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
