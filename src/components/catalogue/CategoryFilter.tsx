"use client";

import { CategoryFilter as CategoryType } from "@/types";
import { useStore } from "@/store/useStore";

const categories: CategoryType[] = [
  "All Species",
  "Monster Fish",
  "Tetras",
  "Polypterus",
  "Puffers",
  "Cichlids",
  "Crabs",
  "Catfish",
  "Killifish",
  "Lungfish",
  "Oddballs",
];

export default function CategoryFilter() {
  const { activeCategory, setActiveCategory } = useStore();

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 min-w-max px-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? "bg-sky-800 text-white shadow"
                : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
