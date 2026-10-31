"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductModal() {
  const {
    selectedProduct,
    selectedSize,
    setSelectedSize,
    setSelectedProduct,
    addToCart,
  } = useStore();

  if (!selectedProduct) return null;

  // ui/dialog supplies role="dialog", Esc-to-close, focus trap/return and
  // scroll lock. Bottom sheet on mobile, centred card from sm up.
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) setSelectedProduct(null);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 translate-y-0 max-w-full sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 bg-white rounded-b-none rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="relative aspect-16/8 sm:aspect-16/8 shrink-0 bg-linear-to-br from-sky-50 to-emerald-50">
          <Image
            src={selectedProduct.imageUrl}
            alt={selectedProduct.commonName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <DialogClose
            aria-label="Close"
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow"
              />
            }
          >
            <X className="size-5" />
          </DialogClose>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {selectedProduct.commonName}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-emerald-700 italic mt-1">
            {selectedProduct.scientificName}
          </DialogDescription>

          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-sm">
            <Card className="bg-slate-50 border-0 rounded-xl">
              <CardContent className="p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                  Category
                </p>
                <p className="font-semibold text-slate-800">
                  {selectedProduct.category}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 rounded-xl">
              <CardContent className="p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                  Class/Order
                </p>
                <p className="font-semibold text-slate-800">
                  {selectedProduct.classOrder || "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
            {selectedProduct.description}
          </p>

          <div className="mt-4 sm:mt-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Available Sizes
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {selectedProduct.sizes.map((size) => (
                <Button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  variant={selectedSize === size ? "default" : "outline"}
                  aria-pressed={selectedSize === size}
                  size="sm"
                  className={`rounded-full ${
                    selectedSize === size
                      ? "bg-sky-800 text-white border-sky-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                  }`}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => {
                const size = selectedSize || selectedProduct.sizes[0] || "";
                addToCart(selectedProduct, size);
                const { activeOrderGroup } = useStore.getState();
                toast.success(
                  `${selectedProduct.commonName} added to ${activeOrderGroup}`,
                  {
                    description: `Size: ${size}`,
                  },
                );
                setSelectedProduct(null);
              }}
              className="flex-1 rounded-xl h-11 sm:h-12"
            >
              Add to Quote Cart
            </Button>
            <a
              href="https://wa.me/2348168850307"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 sm:h-12 gap-2",
              )}
            >
              <MessageCircle className="size-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
