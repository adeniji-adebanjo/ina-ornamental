"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Minus,
  Plus,
  Trash2,
  MessageCircle,
  FolderPlus,
  Pencil,
  X,
  Check,
  Package,
  Info,
  Search,
  ChevronDown,
} from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderClient() {
  const {
    cart,
    orderGroups,
    activeOrderGroup,
    updateQuantity,
    removeFromCart,
    addOrderGroup,
    removeOrderGroup,
    renameOrderGroup,
    setActiveOrderGroup,
    clearCart,
  } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  // "none" keeps the add-to-cart order; the rest sort by the fish (common) name
  // or the scientific name, ascending or descending.
  const [sortOrder, setSortOrder] = useState<
    "none" | "name-az" | "name-za" | "sci-az" | "sci-za"
  >("none");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "NG") ?? COUNTRIES[0],
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const phoneCodeRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Hide the sticky mobile action bar once the order form is on screen.
  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSummaryVisible(entry.isIntersecting),
      { rootMargin: "-30% 0px -30% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        countryRef.current &&
        !countryRef.current.contains(event.target as Node)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        phoneCodeRef.current &&
        !phoneCodeRef.current.contains(event.target as Node)
      ) {
        setPhoneCodeOpen(false);
      }
    };

    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348168850307";

  const whatsappMessage = useMemo(() => {
    const groups = orderGroups.reduce(
      (acc: Array<{ name: string; items: typeof cart }>, groupName) => {
        const groupItems = cart.filter((item) => item.group === groupName);
        if (groupItems.length > 0) {
          acc.push({ name: groupName, items: groupItems });
        }
        return acc;
      },
      [],
    );

    const lines: string[] = [
      "Hello INÁ Ornamental Fish,",
      "",
      `Customer: ${customerName || "N/A"}`,
      `Email: ${customerEmail || "N/A"}`,
      `Country/Region: ${selectedCountry?.name ?? "N/A"}`,
      companyName ? `Company: ${companyName}` : "",
      "",
      groups.length
        ? "I would like to place the following order:"
        : "I would like to enquire about an order.",
      "",
    ].filter(Boolean) as string[];

    groups.forEach((group) => {
      lines.push(`${group.name}:`);
      group.items.forEach((item) => {
        const sizeLabel = item.selectedSize ? ` (${item.selectedSize})` : "";
        lines.push(
          `- ${item.product.commonName}${sizeLabel}: ${item.quantity} pcs`,
        );
      });
      lines.push("");
    });

    if (groups.length) {
      lines.push(`Total items: ${totalItems}`);
      lines.push("");
      lines.push("Please respond with availability and shipping details.");
    }

    return encodeURIComponent(lines.join("\n"));
  }, [cart, orderGroups, customerName, customerEmail, companyName, selectedCountry, totalItems]);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Require the important customer details before allowing a WhatsApp order.
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const whatsappBlockReason =
    cart.length === 0
      ? "Add at least one item to your cart first."
      : !customerName.trim()
        ? "Enter your name before ordering via WhatsApp."
        : !emailValid
          ? "Enter a valid email before ordering via WhatsApp."
          : "";
  const canOrderViaWhatsApp = whatsappBlockReason === "";

  const handleAddGroup = () => {
    const letter = String.fromCharCode(65 + orderGroups.length);
    const name = `Order ${letter}`;
    addOrderGroup(name);
    toast.success(`Created "${name}"`);
  };

  const handleStartRename = (group: string) => {
    setEditingGroup(group);
    setEditValue(group);
  };

  const handleFinishRename = () => {
    if (editingGroup && editValue.trim()) {
      renameOrderGroup(editingGroup, editValue.trim());
    }
    setEditingGroup(null);
    setEditValue("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const groups = orderGroups
      .map((groupName) => {
        const groupItems = cart.filter((item) => item.group === groupName);
        if (groupItems.length === 0) return null;
        return {
          name: groupName,
          items: groupItems.map((item) => ({
            species_id: item.product.slug,
            species_name: item.product.commonName,
            scientific_name: item.product.scientificName,
            size: item.selectedSize,
            quantity: item.quantity,
            qty_per_box: item.product.qtyPerBox ?? 1,
          })),
        };
      })
      .filter(Boolean);

    const body = {
      customer_name: formData.get("customer_name") as string,
      company_name: formData.get("company_name") as string,
      email: formData.get("email") as string,
      phone: `${selectedCountry.dialCode} ${phoneNumber}`,
      country: selectedCountry.name,
      delivery_address: formData.get("delivery_address") as string,
      notes: formData.get("notes") as string,
      // Honeypot — real users leave this blank; bots that autofill it are dropped.
      website: (formData.get("website") as string) || "",
      groups,
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
        clearCart();
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
  };

  return (
    <>
      <section className="bg-linear-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 mb-3">
            INÁ Ornamental Portal
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight">
            Request Order Quote
          </h1>
          <p className="mt-4 max-w-3xl text-sky-100 text-sm md:text-base leading-relaxed">
            Review your selected species organized by shipment groups. Create
            separate groups for different shipments, add species to each from
            the catalogue, and submit for a custom quote from our export team.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Customer journey guidance */}
        <Card className="mb-8 border-sky-100 bg-sky-50/50 rounded-2xl">
          <CardContent className="p-4 md:p-5">
            <div className="flex gap-3">
              <Info className="size-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  How the quote process works
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>
                    Browse our{" "}
                    <a
                      href="/catalogue"
                      className="text-sky-700 underline underline-offset-2"
                    >
                      catalogue
                    </a>{" "}
                    and add species to your cart
                  </li>
                  <li>
                    Organize items into shipment groups (e.g. different orders
                    or destinations)
                  </li>
                  <li>Fill in your details and submit your quote request</li>
                  <li>
                    Our team reviews your request and prepares a custom price
                    list
                  </li>
                  <li>
                    You&apos;ll receive a private pricing link via email to
                    confirm your order
                  </li>
                </ol>
                <p className="text-xs text-slate-500 pt-1">
                  Already have a pricing link? Check your email for your
                  personalized order page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            {/* Group tabs + controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                Quote Cart
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddGroup}
                  variant="outline"
                  size="sm"
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <FolderPlus className="size-4 mr-1" />
                  New Group
                </Button>
                {cart.length > 0 && (
                  <Button
                    onClick={() => {
                      clearCart();
                      toast.info("Cart cleared");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Group tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {orderGroups.map((groupName) => {
                const groupCount = cart.filter(
                  (i) => i.group === groupName,
                ).length;
                return (
                  <Button
                    key={groupName}
                    onClick={() => setActiveOrderGroup(groupName)}
                    variant={
                      activeOrderGroup === groupName ? "default" : "outline"
                    }
                    size="sm"
                    className={`rounded-full ${
                      activeOrderGroup === groupName
                        ? "bg-sky-700 text-white"
                        : "border-slate-200"
                    }`}
                  >
                    {groupName}
                    {groupCount > 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({groupCount})
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Active group content */}
            {orderGroups.map((groupName) => {
              if (groupName !== activeOrderGroup) return null;
              const groupItems = cart.filter(
                (item) => item.group === groupName,
              );
              // Copy before sorting so the cart order itself is left untouched.
              const byScientific = sortOrder.startsWith("sci-");
              const descending = sortOrder.endsWith("-za");
              const displayItems =
                sortOrder === "none"
                  ? groupItems
                  : [...groupItems].sort((a, b) => {
                      const key = (i: (typeof groupItems)[number]) =>
                        (byScientific
                          ? i.product.scientificName
                          : i.product.commonName) ?? "";
                      const cmp = key(a).localeCompare(key(b), undefined, {
                        sensitivity: "base",
                      });
                      return descending ? -cmp : cmp;
                    });

              return (
                <div key={groupName} className="space-y-3">
                  {/* Group header with rename/delete */}
                  <div className="flex items-center gap-2">
                    {editingGroup === groupName ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleFinishRename();
                            if (e.key === "Escape") setEditingGroup(null);
                          }}
                          className="h-8 text-sm font-semibold w-48"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleFinishRename}
                          className="text-emerald-600"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingGroup(null)}
                          className="text-slate-400"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-slate-700">
                          {groupName}
                        </h3>
                        <span className="text-xs text-slate-400">
                          ({groupItems.length}{" "}
                          {groupItems.length === 1 ? "item" : "items"})
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleStartRename(groupName)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        {orderGroups.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              removeOrderGroup(groupName);
                              toast.info(`"${groupName}" removed, items moved`);
                            }}
                            className="text-red-400 hover:text-red-600 ml-auto"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {groupItems.length > 1 && (
                    <div className="flex items-center justify-end gap-2">
                      <label
                        htmlFor="order-sort"
                        className="text-xs font-medium text-slate-500"
                      >
                        Sort
                      </label>
                      <select
                        id="order-sort"
                        value={sortOrder}
                        onChange={(e) =>
                          setSortOrder(
                            e.target.value as
                              | "none"
                              | "name-az"
                              | "name-za"
                              | "sci-az"
                              | "sci-za",
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white h-8 px-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40"
                      >
                        <option value="none">Default</option>
                        <option value="name-az">Name A–Z</option>
                        <option value="name-za">Name Z–A</option>
                        <option value="sci-az">Sci. name A–Z</option>
                        <option value="sci-za">Sci. name Z–A</option>
                      </select>
                    </div>
                  )}

                  {groupItems.length === 0 ? (
                    <Card className="border-slate-100 bg-slate-50 rounded-2xl">
                      <CardContent className="p-6 text-center">
                        <Package className="size-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">
                          No items in this group yet.
                        </p>
                        <a
                          href="/catalogue"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "mt-3 rounded-xl",
                          )}
                        >
                          Browse Catalogue
                        </a>
                      </CardContent>
                    </Card>
                  ) : (
                    displayItems.map((item) => (
                      <Card
                        key={`${item.product.id}-${item.selectedSize}-${groupName}`}
                        className="border-slate-100 rounded-2xl shadow-sm"
                      >
                        <CardContent className="p-4 md:p-5">
                          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900">
                                {item.product.commonName}
                              </h3>
                              <p className="text-sm italic text-emerald-700">
                                {item.product.scientificName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">
                                  Size: {item.selectedSize}
                                </span>
                                {item.product.qtyPerBox > 1 && (
                                  <span className="text-xs text-slate-400">
                                    • {item.product.qtyPerBox} pcs/box
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.quantity - 1,
                                    groupName,
                                  )
                                }
                                variant="outline"
                                size="icon-sm"
                                className="border-slate-200"
                              >
                                <Minus className="size-4" />
                              </Button>
                              <span className="w-10 text-center font-semibold text-slate-800">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.quantity + 1,
                                    groupName,
                                  )
                                }
                                variant="outline"
                                size="icon-sm"
                                className="border-slate-200"
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>

                            <Button
                              onClick={() => {
                                removeFromCart(
                                  item.product.id,
                                  item.selectedSize,
                                  groupName,
                                );
                                toast.info(
                                  `${item.product.commonName} removed`,
                                );
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          <div ref={summaryRef} id="order-summary" className="xl:col-span-1 scroll-mt-24">
            <Card className="sticky top-24 border-slate-100 rounded-2xl shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Order Details
                </h2>
                <p className="text-sm text-slate-500 mb-1">
                  Total requested units: {totalItems}
                </p>
                {orderGroups.length > 1 && (
                  <p className="text-xs text-slate-400 mb-4">
                    {orderGroups.length} shipment groups •{" "}
                    {orderGroups
                      .map(
                        (g) =>
                          `${g} (${cart.filter((i) => i.group === g).length})`,
                      )
                      .join(", ")}
                  </p>
                )}

                {submitted ? (
                  <Card className="bg-emerald-50 border-emerald-200 rounded-xl">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-emerald-800">
                        Order submitted successfully
                      </h3>
                      <p className="text-sm text-emerald-700 mt-1">
                        Reference: <strong>{orderRef}</strong>
                      </p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Our team will contact you shortly via email or WhatsApp
                        with your custom quote.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmit}>
                    {/* Honeypot: hidden from users; bots that fill it are dropped. */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                    />
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
                    <div className="space-y-3">
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
                          <div className="absolute top-full left-0 mt-1 w-72 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
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
                                  value={countrySearch}
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

                      <div className="relative" ref={countryRef}>
                        <input
                          type="hidden"
                          name="country"
                          value={selectedCountry.name}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCountryDropdownOpen(!countryDropdownOpen)
                          }
                          className="flex items-center justify-between w-full h-10 px-3 rounded-xl border border-input bg-transparent text-sm hover:bg-slate-50"
                        >
                          <span className="text-slate-900">
                            {selectedCountry.name}
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
                                  value={countrySearch}
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
                                  c.code === selectedCountry.code
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
                    </div>
                    <Input
                      name="delivery_address"
                      placeholder="Delivery Address"
                      className="rounded-xl h-10"
                    />
                    <Textarea
                      name="notes"
                      placeholder="Additional notes (species preference, shipment timeline, special requests)"
                      rows={4}
                      className="rounded-xl"
                    />

                    <Button
                      type="submit"
                      disabled={cart.length === 0 || submitting}
                      className={`w-full rounded-xl h-11 ${
                        cart.length === 0
                          ? "bg-slate-300 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {submitting ? "Submitting..." : "Submit Order"}
                    </Button>
                  </form>
                )}

                {canOrderViaWhatsApp ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 gap-2",
                    )}
                  >
                    <MessageCircle className="size-4" />
                    Order via WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    aria-disabled="true"
                    onClick={() => toast.error(whatsappBlockReason)}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "mt-4 w-full cursor-not-allowed gap-2 rounded-xl h-11 bg-emerald-600 text-white opacity-50 hover:bg-emerald-600",
                    )}
                  >
                    <MessageCircle className="size-4" />
                    Order via WhatsApp
                  </button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sticky mobile action bar — reach the order form without scrolling
          past the whole species list. Hidden once the form is on screen. */}
      {totalItems > 0 && !summaryVisible && (
        <div className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-2.5 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] leading-tight text-slate-500">
                Your order
              </p>
              <p className="text-sm font-semibold leading-tight text-slate-900">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                summaryRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="ml-auto h-10 rounded-full px-5"
            >
              Review &amp; Complete
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
