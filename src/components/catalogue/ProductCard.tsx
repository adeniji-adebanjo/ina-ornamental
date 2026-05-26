"use client";

import { FishProduct } from "@/types";
import { useStore } from "@/store/useStore";
import Image from "next/image";
import { useState } from "react";

interface ProductCardProps {
  product: FishProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    addToCart,
    setSelectedProduct,
    setSelectedSize: setStoreSize,
  } = useStore();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSize) return;
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      onClick={() => {
        setSelectedProduct(product);
        setStoreSize(product.sizes[0] || "");
      }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      <div className="relative aspect-4/3 bg-linear-to-br from-sky-50 to-emerald-50 overflow-hidden">
        {!imgError && product.imageUrl !== "/images/fish-placeholder.svg" ? (
          <Image
            src={product.imageUrl}
            alt={product.commonName}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-sky-300">
            <svg
              className="w-14 h-14 mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-xs font-medium text-sky-400 px-2 text-center">
              {product.commonName}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.featured && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase">
              Featured
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full uppercase ${product.inStock ? "bg-emerald-500" : "bg-red-500"}`}
          >
            {product.inStock ? "In Stock" : "Sold Out"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-sky-700 transition-colors">
            {product.commonName}
          </h3>
          <p className="text-sm text-emerald-700 italic mt-0.5">
            {product.scientificName}
          </p>
          <span className="inline-block mt-2 text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
            {product.category}
          </span>
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(size);
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedSize === size
                    ? "bg-sky-700 text-white border-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
              added
                ? "bg-emerald-600 text-white"
                : product.inStock
                  ? "bg-sky-800 hover:bg-sky-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {added ? "Added" : "Add to Quote"}
          </button>
        </div>
      </div>
    </article>
  );
}
