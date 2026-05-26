"use client";

import { useMemo } from "react";
import { FishProduct } from "@/types";
import { useStore } from "@/store/useStore";
import SearchBar from "@/components/catalogue/SearchBar";
import CategoryFilter from "@/components/catalogue/CategoryFilter";
import ProductCard from "@/components/catalogue/ProductCard";
import ProductModal from "@/components/catalogue/ProductModal";

interface CatalogueClientProps {
  products: FishProduct[];
}

export default function CatalogueClient({ products }: CatalogueClientProps) {
  const { activeCategory, searchQuery } = useStore();

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const byCategory =
        activeCategory === "All Species" ||
        product.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        product.tags.some((t) =>
          t.toLowerCase().includes(activeCategory.toLowerCase())
        );

      const byQuery =
        query.length === 0 ||
        product.commonName.toLowerCase().includes(query) ||
        product.scientificName.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.tags.some((t) => t.toLowerCase().includes(query));

      return byCategory && byQuery;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <>
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase mb-3">
            B2B GLOBAL EXPORT • LAGOS, NIGERIA
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight max-w-3xl">
            Premium West African Ornamental Fish
          </h1>
          <p className="mt-4 text-slate-600 max-w-3xl text-sm md:text-base leading-relaxed">
            Sustainably sourced. Expertly quarantined. Delivered worldwide with a
            live arrival guarantee. Explore our current inventory and request a
            custom B2B quote.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-sky-800">22+</p>
              <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Years Experience</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-emerald-700">120+</p>
              <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Species Available</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-sky-800">Global</p>
              <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">Export Coverage</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="space-y-4">
          <SearchBar />
          <CategoryFilter />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Species Catalogue</h2>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredProducts.length}</span> species
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center py-14 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-slate-500">No species matched your filters.</p>
            <p className="text-sm text-slate-400 mt-1">Try another category or a broader search term.</p>
          </div>
        )}
      </section>

      <ProductModal />
    </>
  );
}
