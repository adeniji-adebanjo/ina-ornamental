"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { ClientPriceListWithItems } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  ShoppingCart,
  MessageCircle,
  Package,
  ChevronDown,
  Search,
} from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import Image from "next/image";

const AVAILABILITY_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  available: {
    label: "IN STOCK",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  limited_stock: {
    label: "LIMITED",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  out_of_stock: {
    label: "UNAVAILABLE",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  seasonal: {
    label: "SEASONAL",
    color: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  on_request: {
    label: "ON REQUEST",
    color: "bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

interface OrderGroup {
  id: number;
  name: string;
  items: Record<string, { pieces: number; boxes: number }>;
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

  // Phone & country state
  const defaultCountry = COUNTRIES.find(
    (c) => c.name === priceList.client?.country,
  );
  const [selectedCountry, setSelectedCountry] = useState(
    defaultCountry ?? COUNTRIES.find((c) => c.code === "NG")!,
  );
  const [phoneNumber, setPhoneNumber] = useState(
    priceList.client?.phone?.replace(/^\+\d+\s?/, "") ?? "",
  );
  const [customerName, setCustomerName] = useState(
    priceList.client?.name ?? "",
  );
  const [customerEmail, setCustomerEmail] = useState(
    priceList.client?.email ?? "",
  );
  const [companyName, setCompanyName] = useState(
    priceList.client?.company ?? "",
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const phoneCodeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        countryRef.current &&
        !countryRef.current.contains(e.target as Node)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        phoneCodeRef.current &&
        !phoneCodeRef.current.contains(e.target as Node)
      ) {
        setPhoneCodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeGroup = groups.find((g) => g.id === activeGroupId)!;

  const totalPieces = groups.reduce(
    (sum, g) => sum + Object.values(g.items).reduce((s, i) => s + i.pieces, 0),
    0,
  );

  const totalBoxes = groups.reduce(
    (sum, g) => sum + Object.values(g.items).reduce((s, i) => s + i.boxes, 0),
    0,
  );

  // Filters
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  const classOptions = useMemo(() => {
    const setOpts = new Set<string>();
    for (const it of priceList.items) {
      const cls =
        it.species?.class_order ||
        it.species?.category?.name ||
        "Unspecified";
      setOpts.add(cls);
    }
    return Array.from(setOpts);
  }, [priceList.items]);

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348168850307";

  const whatsappMessage = useMemo(() => {
    const groupsWithItems = groups.filter(
      (g) => Object.keys(g.items).length > 0,
    );

    const lines: string[] = [
      "Hello INÁ Ornamental Fish,",
      "",
      `Customer: ${customerName || "N/A"}`,
      `Email: ${customerEmail || "N/A"}`,
      `Country/Region: ${selectedCountry?.name ?? "N/A"}`,
      ...(companyName ? [`Company: ${companyName}`] : []),
      "",
      groupsWithItems.length
        ? "I would like to place the following order:"
        : "I would like to enquire about an order.",
      "",
    ];

    groupsWithItems.forEach((group) => {
      lines.push(`${group.name}:`);
      Object.entries(group.items).forEach(([speciesId, { pieces, boxes }]) => {
        const item = priceList.items.find((pi) => pi.species_id === speciesId);
        const name = item?.species?.common_name ?? speciesId;
        const price = item?.custom_price
          ? ` @ $${item.custom_price.toFixed(2)}`
          : "";
        lines.push(`- ${name}: ${pieces} pcs / ${boxes.toFixed(2)} bx${price}`);
      });
      lines.push("");
    });

    if (groupsWithItems.length) {
      lines.push(`Total pieces: ${totalPieces}`);
      lines.push(`Total boxes: ${totalBoxes.toFixed(2)}`);
      lines.push("");
      lines.push("Please respond with availability and next steps.");
    }

    return lines.join("\n");
  }, [
    groups,
    priceList.items,
    totalPieces,
    totalBoxes,
    customerName,
    customerEmail,
    companyName,
    selectedCountry,
  ]);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  // Require the important customer details before allowing WhatsApp contact.
  const customerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const whatsappBlockReason = !customerName.trim()
    ? "Enter your name before contacting via WhatsApp."
    : !customerEmailValid
      ? "Enter a valid email before contacting via WhatsApp."
      : "";
  const canContactViaWhatsApp = whatsappBlockReason === "";

  const filteredItems = useMemo(() => {
    return priceList.items.filter((item) => {
      const sp = item.species;
      const avail = sp?.availability || "on_request";
      const cls = sp?.class_order || sp?.category?.name || "Unspecified";
      if (availabilityFilter !== "all" && availabilityFilter !== avail)
        return false;
      if (classFilter !== "all" && classFilter !== cls) return false;
      return true;
    });
  }, [priceList.items, availabilityFilter, classFilter]);

  function setPieces(speciesId: string, pieces: number, qtyPerBox: number) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== activeGroupId) return g;
        if (pieces <= 0) {
          const rest = { ...g.items };
          delete rest[speciesId];
          return { ...g, items: rest };
        }
        return {
          ...g,
          items: {
            ...g.items,
            [speciesId]: {
              pieces,
              boxes: parseFloat((pieces / qtyPerBox).toFixed(2)),
            },
          },
        };
      }),
    );
  }

  function setBoxes(speciesId: string, boxes: number, qtyPerBox: number) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== activeGroupId) return g;
        const pieces = Math.round(boxes * qtyPerBox);
        if (pieces <= 0) {
          const rest = { ...g.items };
          delete rest[speciesId];
          return { ...g, items: rest };
        }
        return {
          ...g,
          items: {
            ...g.items,
            [speciesId]: { pieces, boxes: parseFloat(boxes.toFixed(2)) },
          },
        };
      }),
    );
  }

  function addBoxFraction(
    speciesId: string,
    fraction: number,
    qtyPerBox: number,
  ) {
    const current = activeGroup.items[speciesId]?.boxes ?? 0;
    setBoxes(speciesId, current + fraction, qtyPerBox);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (totalPieces === 0) return;

    // Validate phone length
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, "");
      if (digits.length < selectedCountry.minDigits) {
        toast.error(
          `Phone number must be at least ${selectedCountry.minDigits} digits for ${selectedCountry.name}`,
        );
        return;
      }
    }

    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const orderGroups = groups
      .filter((g) => Object.keys(g.items).length > 0)
      .map((g) => ({
        name: g.name,
        items: Object.entries(g.items).map(([speciesId, { pieces }]) => {
          const priceItem = priceList.items.find(
            (pi) => pi.species_id === speciesId,
          );
          return {
            species_id: speciesId,
            species_name: priceItem?.species?.common_name ?? "",
            scientific_name: priceItem?.species?.scientific_name ?? "",
            size: priceItem?.species?.sizes?.join(", ") ?? "",
            quantity: pieces,
            unit_price: priceItem?.custom_price ?? null,
          };
        }),
      }));

    const body = {
      customer_name: formData.get("customer_name"),
      company_name: formData.get("company_name"),
      email: formData.get("email"),
      phone: phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : "",
      country: selectedCountry?.name ?? "",
      delivery_address: formData.get("delivery_address"),
      proposed_shipment_date: formData.get("proposed_shipment_date"),
      consignee_name: formData.get("consignee_name"),
      consignee_phone: formData.get("consignee_phone"),
      consignee_address: formData.get("consignee_address"),
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
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "We couldn't submit your order. Please try again.");
      }
    } catch {
      toast.error("Network error — please check your connection and try again.");
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
              Thanks for trusting us
            </h2>
            <p className="text-slate-600 mt-2">
              Reference: <strong className="font-mono">{orderRef}</strong>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Thanks for trusting us; we&apos;re currently verifying your order
              and
              prepping for a safe journey to ensure your new arrivals reach you
              in peak condition.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              By submitting this form, an Excel invoice will be automatically
              generated and shared with the INÁ team for procurement. You will
              also receive the invoice by email for your records.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-sky-800 truncate">
              INÁ Ornamental Fish
            </h1>
            <p className="text-xs text-slate-500 truncate">{priceList.title}</p>
          </div>
          <Badge
            variant="outline"
            className="text-emerald-700 whitespace-nowrap"
          >
            <Package className="size-3 mr-1" /> {totalBoxes.toFixed(2)} Boxes
          </Badge>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 overflow-x-auto py-2">
          {groups.map((g) => {
            const groupPieces = Object.values(g.items).reduce(
              (s, i) => s + i.pieces,
              0,
            );
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGroupId(g.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  g.id === activeGroupId
                    ? "bg-sky-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {g.name}
                {groupPieces > 0 && (
                  <span className="ml-1.5 text-xs opacity-75">
                    ({groupPieces} pcs)
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={addGroup}
            className="px-3 py-2 rounded-full text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            + New Group
          </button>
          {groups.length > 1 && (
            <button
              type="button"
              onClick={() => removeGroup(activeGroupId)}
              className="px-3 py-2 rounded-full text-sm text-red-500 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4 sticky top-[115px] z-30 bg-white border-b border-slate-200 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-600">Availability</label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 h-9 px-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="limited_stock">Scarce</option>
                  <option value="seasonal">Out of Season</option>
                  <option value="out_of_stock">Unavailable</option>
                  <option value="on_request">On Request</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-600">Class</label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 h-9 px-2 text-sm"
                >
                  <option value="all">All</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const sp = item.species;
              if (!sp) return null;
              const qtyPerBox = sp.qty_per_box || 1;
              const pieces = activeGroup.items[item.species_id]?.pieces ?? 0;
              const boxes = activeGroup.items[item.species_id]?.boxes ?? 0;
              const mainImg =
                sp.images?.[0]?.image_url ?? "/images/fish-placeholder.svg";
              const avail =
                AVAILABILITY_CONFIG[sp.availability] ??
                AVAILABILITY_CONFIG.on_request;

              return (
                <Card key={item.id} className="rounded-xl overflow-hidden">
                  <div className="relative h-32 sm:h-40 bg-slate-100 overflow-hidden">
                    <Image
                      src={mainImg}
                      alt={sp.common_name}
                      fill
                      sizes="(max-width: 640px) 50vw, 320px"
                      unoptimized
                      className="object-cover"
                    />
                    {/* Availability badge */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${avail.color}`}
                    >
                      {avail.label}
                    </span>
                  </div>
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    {/* Name & price */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {sp.common_name}
                      </h3>
                      <p className="text-xs italic text-slate-500">
                        {sp.scientific_name}
                      </p>
                      <p className="text-lg font-black text-sky-800 mt-1">
                        ${Number(item.custom_price).toFixed(2)}
                      </p>
                    </div>

                    {/* Size & Box info */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 uppercase tracking-wide font-medium">
                      {sp.sizes?.length > 0 && (
                        <span>SIZE: {sp.sizes.join(", ")}</span>
                      )}
                      <span className="text-sky-700 font-bold">
                        BOX: {qtyPerBox}PCS
                      </span>
                    </div>

                    {/* Quick box buttons */}
                    <div className="flex gap-1.5">
                      {[0.25, 0.5, 1].map((frac) => (
                        <button
                          key={frac}
                          onClick={() =>
                            addBoxFraction(item.species_id, frac, qtyPerBox)
                          }
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200"
                        >
                          {frac} BX
                        </button>
                      ))}
                    </div>

                    {/* Pieces & Boxes counters */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Pieces */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Pieces
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setPieces(item.species_id, pieces - 1, qtyPerBox)
                            }
                            disabled={pieces === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <Minus className="size-3" />
                          </button>
                          <Input
                            type="number"
                            min={0}
                            value={pieces}
                            onChange={(e) =>
                              setPieces(
                                item.species_id,
                                parseInt(e.target.value) || 0,
                                qtyPerBox,
                              )
                            }
                            className="h-7 text-center text-sm font-semibold rounded-md px-1 flex-1 min-w-0"
                          />
                          <button
                            onClick={() =>
                              setPieces(item.species_id, pieces + 1, qtyPerBox)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>

                      {/* Boxes */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Boxes
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setBoxes(
                                item.species_id,
                                Math.max(0, boxes - 0.25),
                                qtyPerBox,
                              )
                            }
                            disabled={boxes === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          >
                            <Minus className="size-3" />
                          </button>
                          <Input
                            type="number"
                            min={0}
                            step={0.25}
                            value={boxes.toFixed(2)}
                            onChange={(e) =>
                              setBoxes(
                                item.species_id,
                                parseFloat(e.target.value) || 0,
                                qtyPerBox,
                              )
                            }
                            className="h-7 text-center text-sm font-semibold rounded-md px-1 flex-1 min-w-0"
                          />
                          <button
                            onClick={() =>
                              setBoxes(item.species_id, boxes + 0.25, qtyPerBox)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Order Summary & Form */}
        <div>
          <Card className="rounded-xl sticky top-[120px]">
            <CardContent className="p-4 sm:p-5">
              <h2 className="font-bold text-slate-900 text-lg mb-2">
                Order Summary
              </h2>
<div className="flex flex-wrap gap-3 text-sm mb-4">
                <span className="text-slate-600">
                  <strong className="text-sky-800">{totalPieces}</strong> pieces
                </span>
                <span className="text-slate-600">
                  <strong className="text-sky-800">
                    {totalBoxes.toFixed(2)}
                  </strong>{" "}
                  boxes
                </span>
              </div>

              {totalPieces === 0 ? (
                <p className="text-sm text-slate-500">
                  Select species and quantities to build your order.
                </p>
              ) : (
                <>
                  <div className="space-y-1 mb-4 max-h-48 overflow-y-auto border-t border-slate-100 pt-2">
                    {groups.map((g) =>
                      Object.entries(g.items).map(
                        ([speciesId, { pieces: pcs, boxes: bx }]) => {
                          const pi = priceList.items.find(
                            (i) => i.species_id === speciesId,
                          );
                          const lineTotal = pcs * Number(pi?.custom_price ?? 0);
                          return (
                            <div
                              key={`${g.id}-${speciesId}`}
                              className="flex justify-between text-xs py-1 border-b border-slate-50 gap-1"
                            >
                              <span className="truncate flex-1">
                                {groups.length > 1 && (
                                  <span className="text-slate-400">
                                    [{g.name}]{" "}
                                  </span>
                                )}
                                {pi?.species?.common_name}
                              </span>
                              <span className="font-medium text-slate-600 whitespace-nowrap">
                                {pcs}pcs / {bx.toFixed(2)}bx
                              </span>
                              <span className="font-bold text-sky-800 whitespace-nowrap ml-1">
                                ${lineTotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        },
                      ),
                    )}
                  </div>

                  {/* Grand total */}
                  <div className="flex flex-wrap justify-between items-center gap-3 py-2 border-t border-slate-200 mb-4">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-black text-lg text-sky-800">
                      $
                      {groups
                        .reduce(
                          (sum, g) =>
                            sum +
                            Object.entries(g.items).reduce(
                              (s, [speciesId, { pieces: pcs }]) => {
                                const pi = priceList.items.find(
                                  (i) => i.species_id === speciesId,
                                );
                                return s + pcs * Number(pi?.custom_price ?? 0);
                              },
                              0,
                            ),
                          0,
                        )
                        .toFixed(2)}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                      required
                      name="customer_name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="rounded-xl h-10"
                    />
                    <Input
                      name="company_name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="rounded-xl h-10"
                    />
                    <Input
                      required
                      name="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email Address"
                      className="rounded-xl h-10"
                    />
                    {/* Phone with country code */}
                    <div className="relative" ref={phoneCodeRef}>
                      <div className="flex h-10 rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                        <button
                          type="button"
                          onClick={() => setPhoneCodeOpen(!phoneCodeOpen)}
                          className="flex items-center gap-1 px-2.5 bg-slate-50 border-r border-input text-sm font-medium text-slate-700 hover:bg-slate-100 shrink-0"
                        >
                          {selectedCountry.dialCode}
                          <ChevronDown className="size-3 text-slate-400" />
                        </button>
                        <input
                          type="tel"
                          name="phone"
                          placeholder={`Phone (${selectedCountry.minDigits}-${selectedCountry.maxDigits} digits)`}
                          value={phoneNumber}
                          maxLength={selectedCountry.maxDigits}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            if (digits.length <= selectedCountry.maxDigits) {
                              setPhoneNumber(digits);
                            }
                          }}
                          className="flex-1 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                      {phoneCodeOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full max-w-[90vw] max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                          <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                            <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                              <Search className="size-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search country..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                onChange={(e) =>
                                  setCountrySearch(e.target.value)
                                }
                                autoFocus
                              />
                            </div>
                          </div>
                          {COUNTRIES.filter(
                            (c) =>
                              c.name
                                .toLowerCase()
                                .includes(countrySearch.toLowerCase()) ||
                              c.dialCode.includes(countrySearch),
                          ).map((c) => (
                            <button
                              key={c.code + c.dialCode}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setPhoneCodeOpen(false);
                                setCountrySearch("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                            >
                              <span>{c.name}</span>
                              <span className="text-slate-400 text-xs font-mono">
                                {c.dialCode}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Country searchable dropdown */}
                    <div className="relative" ref={countryRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setCountryDropdownOpen(!countryDropdownOpen)
                        }
                        className="flex items-center justify-between w-full h-10 px-3 rounded-xl border border-input bg-transparent text-sm hover:bg-slate-50"
                      >
                        <span
                          className={
                            selectedCountry
                              ? "text-slate-900"
                              : "text-muted-foreground"
                          }
                        >
                          {selectedCountry?.name ?? "Select Country"}
                        </span>
                        <ChevronDown className="size-4 text-slate-400" />
                      </button>
                      {countryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                          <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                            <div className="flex items-center gap-2 px-2 h-8 rounded-lg bg-slate-50 border border-slate-200">
                              <Search className="size-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search country..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                onChange={(e) =>
                                  setCountrySearch(e.target.value)
                                }
                                autoFocus
                              />
                            </div>
                          </div>
                          {COUNTRIES.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(countrySearch.toLowerCase()),
                          ).map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setCountryDropdownOpen(false);
                                setCountrySearch("");
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                                c.code === selectedCountry?.code
                                  ? "bg-sky-50 text-sky-800 font-medium"
                                  : ""
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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

              {canContactViaWhatsApp ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="size-4" />
                  Contact via WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  onClick={() => toast.error(whatsappBlockReason)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl h-11 text-sm font-semibold opacity-50 cursor-not-allowed"
                >
                  <MessageCircle className="size-4" />
                  Contact via WhatsApp
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    // </div>
  );
}
