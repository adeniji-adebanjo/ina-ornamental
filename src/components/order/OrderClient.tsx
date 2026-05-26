"use client";

import { FormEvent, useState } from "react";
import { useStore } from "@/store/useStore";

export default function OrderClient() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [submitted, setSubmitted] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="bg-gradient-to-br from-slate-900 via-sky-900 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 mb-3">
            iNA Ornamental Portal
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">Request Order Quote</h1>
          <p className="mt-4 max-w-3xl text-sky-100 text-sm md:text-base leading-relaxed">
            Add species to your quote cart and submit your shipment request. Our export team will provide pricing, packing, documentation, and delivery timeline.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">Quote Cart</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-600">Your quote cart is currently empty.</p>
                <a
                  href="/catalogue"
                  className="inline-block mt-4 bg-sky-800 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Browse Catalogue
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <article
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{item.product.commonName}</h3>
                        <p className="text-sm italic text-emerald-700">{item.product.scientificName}</p>
                        <p className="text-xs text-slate-500 mt-1">Size: {item.selectedSize}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-24 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Order Details</h2>
              <p className="text-sm text-slate-500 mb-4">Total requested units: {totalItems}</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-semibold text-emerald-800">Quote request received</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Thank you. Our team will contact you shortly via email or WhatsApp.
                  </p>
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <input required placeholder="Full Name" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <input placeholder="Company Name" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <input required type="email" placeholder="Email Address" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <input required placeholder="WhatsApp / Phone" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <input required placeholder="Country" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <textarea placeholder="Additional notes (species preference, shipment timeline, special requests)" rows={4} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200" />

                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${
                      cart.length === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-sky-800 hover:bg-sky-700"
                    }`}
                  >
                    Submit Quote Request
                  </button>
                </form>
              )}

              <a
                href="https://wa.me/2348168850307"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-block text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl"
              >
                Order via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
