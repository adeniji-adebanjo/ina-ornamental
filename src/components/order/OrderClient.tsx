"use client";

import { FormEvent, useState } from "react";
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
} from "lucide-react";
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

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          })),
        };
      })
      .filter(Boolean);

    const body = {
      customer_name: formData.get("customer_name") as string,
      company_name: formData.get("company_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      country: formData.get("country") as string,
      delivery_address: formData.get("delivery_address") as string,
      notes: formData.get("notes") as string,
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
        toast.error(err?.error || "Failed to submit order");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <>
      <section className="bg-linear-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 mb-3">
            iNA Ornamental Portal
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
                    groupItems.map((item) => (
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

          <div className="xl:col-span-1">
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
                    <Input
                      required
                      name="customer_name"
                      placeholder="Full Name"
                      className="rounded-xl h-10"
                    />
                    <Input
                      name="company_name"
                      placeholder="Company Name"
                      className="rounded-xl h-10"
                    />
                    <Input
                      required
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      className="rounded-xl h-10"
                    />
                    <Input
                      required
                      name="phone"
                      placeholder="WhatsApp / Phone"
                      className="rounded-xl h-10"
                    />
                    <Input
                      required
                      name="country"
                      placeholder="Country / Region"
                      className="rounded-xl h-10"
                    />
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

                <a
                  href="https://wa.me/2348168850307"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
