"use client";

import { FormEvent, useState } from "react";
import { useStore } from "@/store/useStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderClient() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const body = {
      customer_name: formData.get("customer_name") as string,
      company_name: formData.get("company_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      country: formData.get("country") as string,
      delivery_address: formData.get("delivery_address") as string,
      notes: formData.get("notes") as string,
      groups: [
        {
          name: "Order A",
          items: cart.map((item) => ({
            species_id: item.product.slug, // used as reference
            species_name: item.product.commonName,
            scientific_name: item.product.scientificName,
            size: item.selectedSize,
            quantity: item.quantity,
          })),
        },
      ],
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
            Add species to your quote cart and submit your shipment request. Our
            export team will provide pricing, packing, documentation, and
            delivery timeline.
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
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card
                    key={`${item.product.id}-${item.selectedSize}`}
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
                            removeFromCart(item.product.id, item.selectedSize);
                            toast.info(
                              `${item.product.commonName} removed from cart`,
                            );
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <Card className="sticky top-24 border-slate-100 rounded-2xl shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Order Details
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Total requested units: {totalItems}
                </p>

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
