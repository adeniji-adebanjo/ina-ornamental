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
  ArrowRight,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderClient() {
  const {
    cart,
    orderGroups,
    updateQuantity,
    removeFromCart,
    moveToGroup,
    addOrderGroup,
    removeOrderGroup,
    renameOrderGroup,
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
    toast.success(`Added "${name}"`);
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
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            Request Order Quote
          </h1>
          <p className="mt-4 max-w-3xl text-sky-100 text-sm md:text-base leading-relaxed">
            Add species to your quote cart, organise them into separate shipment
            groups if needed, and submit. Our export team will respond with
            pricing, packing details, and a delivery timeline.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                Quote Cart
              </h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button
                    onClick={handleAddGroup}
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <FolderPlus className="size-4 mr-1" />
                    Add Group
                  </Button>
                )}
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
                    <Trash2 className="size-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {cart.length === 0 ? (
              <Card className="border-slate-100 bg-slate-50 rounded-2xl">
                <CardContent className="p-8 text-center">
                  <p className="text-slate-600">
                    Your quote cart is currently empty.
                  </p>
                  <a
                    href="/catalogue"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "mt-4 rounded-xl",
                    )}
                  >
                    Browse Catalogue
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orderGroups.map((groupName) => {
                  const groupItems = cart.filter(
                    (item) => item.group === groupName,
                  );
                  const otherGroups = orderGroups.filter(
                    (g) => g !== groupName,
                  );

                  return (
                    <div key={groupName} className="space-y-3">
                      {/* Group header */}
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                        {editingGroup === groupName ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleFinishRename();
                                if (e.key === "Escape") setEditingGroup(null);
                              }}
                              className="h-7 text-sm font-semibold w-40"
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
                            <h3 className="font-semibold text-slate-700 text-sm">
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
                                  toast.info(
                                    `"${groupName}" removed, items moved`,
                                  );
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
                        <p className="text-xs text-slate-400 italic pl-2">
                          No items in this group yet.
                        </p>
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
                                  <p className="text-xs text-slate-500 mt-1">
                                    Size: {item.selectedSize}
                                  </p>
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

                                <div className="flex items-center gap-1">
                                  {otherGroups.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {otherGroups.map((target) => (
                                        <Button
                                          key={target}
                                          onClick={() => {
                                            moveToGroup(
                                              item.product.id,
                                              item.selectedSize,
                                              groupName,
                                              target,
                                            );
                                            toast.info(`Moved to "${target}"`);
                                          }}
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                                          title={`Move to ${target}`}
                                        >
                                          <ArrowRight className="size-3 mr-1" />
                                          {target}
                                        </Button>
                                      ))}
                                    </div>
                                  )}

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
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                    {orderGroups.length} shipment groups
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
                        Our team will contact you shortly via email or WhatsApp.
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
                      placeholder="Country"
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
