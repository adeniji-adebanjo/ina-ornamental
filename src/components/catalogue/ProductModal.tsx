"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";

export default function ProductModal() {
  const {
    selectedProduct,
    selectedSize,
    setSelectedSize,
    setSelectedProduct,
    addToCart,
  } = useStore();

  if (!selectedProduct) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setSelectedProduct(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300"
      >
        <div className="relative aspect-16/8 bg-linear-to-br from-sky-50 to-emerald-50">
          <Image
            src={selectedProduct.imageUrl}
            alt={selectedProduct.commonName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow flex items-center justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="text-2xl font-bold text-slate-900">
            {selectedProduct.commonName}
          </h3>
          <p className="text-emerald-700 italic mt-1">
            {selectedProduct.scientificName}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                Category
              </p>
              <p className="font-semibold text-slate-800">
                {selectedProduct.category}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                Class/Order
              </p>
              <p className="font-semibold text-slate-800">
                {selectedProduct.classOrder || "-"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-slate-600 leading-relaxed">
            {selectedProduct.description}
          </p>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Available Sizes
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedProduct.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedSize === size
                      ? "bg-sky-800 text-white border-sky-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                addToCart(
                  selectedProduct,
                  selectedSize || selectedProduct.sizes[0] || "",
                );
                setSelectedProduct(null);
              }}
              className="flex-1 bg-sky-800 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Add to Quote Cart
            </button>
            <a
              href="https://wa.me/2348168850307"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
