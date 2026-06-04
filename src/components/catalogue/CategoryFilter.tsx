"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories?: string[];
}

export default function CategoryFilter({
  categories: propCategories,
}: CategoryFilterProps) {
  const { activeCategory, setActiveCategory } = useStore();

  const categories =
    propCategories && propCategories.length > 0
      ? ["All Species", ...propCategories]
      : ["All Species"];

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
