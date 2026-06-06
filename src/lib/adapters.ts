import type { SpeciesWithImages } from "@/types/database";
import type { FishProduct } from "@/types";

/**
 * Converts Supabase SpeciesWithImages to the legacy FishProduct type
 * used by existing catalogue/order components.
 */
export function speciesToFishProduct(s: SpeciesWithImages): FishProduct {
  return {
    id: hashStringToNumber(s.id),
    slug: s.slug,
    commonName: s.common_name,
    scientificName: s.scientific_name ?? "",
    category: s.category?.name ?? "Oddballs",
    classOrder: s.class_order ?? "",
    description: s.description ?? "",
    imageUrl: s.images?.[0]?.image_url ?? "/images/fish-placeholder.svg",
    sizes: s.sizes ?? [],
    tags: s.tags ?? [],
    inStock: s.availability !== "out_of_stock",
    featured: s.featured,
    availability: s.availability,
    qtyPerBox: s.qty_per_box ?? 1,
  };
}

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
