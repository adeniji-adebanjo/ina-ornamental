"use client";

import { FishProduct } from "@/types";
import { useStore } from "@/store/useStore";
import Image from "next/image";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: FishProduct;
}

const AVAILABILITY_CONFIG: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  available: {
    label: "In Stock",
    color: "bg-emerald-50 text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  limited_stock: {
    label: "Limited",
    color: "bg-amber-50 text-amber-700",
    dotColor: "bg-amber-500",
  },
  out_of_stock: {
    label: "Unavailable",
    color: "bg-red-50 text-red-700",
    dotColor: "bg-red-500",
  },
  seasonal: {
    label: "Seasonal",
    color: "bg-sky-50 text-sky-700",
    dotColor: "bg-sky-500",
  },
  on_request: {
    label: "On Request",
    color: "bg-slate-50 text-slate-600",
    dotColor: "bg-slate-400",
  },
};

export default function ProductCard({ product }: ProductCardProps) {
  const {
    addToCart,
    setSelectedProduct,
    setSelectedSize: setStoreSize,
  } = useStore();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const availConfig =
    AVAILABILITY_CONFIG[product.availability] || AVAILABILITY_CONFIG.on_request;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSize) return;
    addToCart(product, selectedSize);
    setAdded(true);
    const { activeOrderGroup } = useStore.getState();
    toast.success(`${product.commonName} added to ${activeOrderGroup}`, {
      description: `Size: ${selectedSize}`,
    });
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Card
      onClick={() => {
        setSelectedProduct(product);
        setStoreSize(product.sizes[0] || "");
      }}
      className="group rounded-2xl border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col p-0"
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
            <Package className="size-14 mb-2 opacity-50" />
            <span className="text-xs font-medium text-sky-400 px-2 text-center">
              {product.commonName}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.featured && (
            <Badge className="bg-amber-500 text-white border-0 text-[10px] uppercase">
              Featured
            </Badge>
          )}
          <Badge
            className={`border-0 text-[10px] uppercase ${availConfig.color}`}
          >
            <span
              className={`inline-block size-1.5 rounded-full mr-1 ${availConfig.dotColor}`}
            />
            {availConfig.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-sky-700 transition-colors">
            {product.commonName}
          </h3>
          <p className="text-sm text-emerald-700 italic mt-0.5">
            {product.scientificName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className="bg-sky-50 text-sky-700 border-0"
            >
              {product.category}
            </Badge>
            {product.qtyPerBox > 1 && (
              <Badge
                variant="secondary"
                className="bg-slate-50 text-slate-600 border-0"
              >
                {product.qtyPerBox} pcs/box
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.sizes.map((size) => (
              <Button
                key={size}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSize(size);
                }}
                variant={selectedSize === size ? "default" : "outline"}
                size="xs"
                className={`rounded-full ${
                  selectedSize === size
                    ? "bg-sky-700 text-white border-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                {size}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={product.availability === "out_of_stock"}
            className={`w-full rounded-xl ${
              added
                ? "bg-emerald-600 text-white"
                : product.availability === "out_of_stock"
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : ""
            }`}
          >
            {added ? "Added" : "Add to Quote"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
