"use client";

import { CategoryFilter as CategoryType } from "@/types";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

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
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "default" : "outline"}
            size="sm"
            className={`rounded-full whitespace-nowrap ${
              activeCategory === category
                ? "bg-sky-800 text-white shadow"
                : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700"
            }`}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
