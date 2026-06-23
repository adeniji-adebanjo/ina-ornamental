import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  SpeciesWithImages,
  Category,
  AvailabilityStatus,
} from "@/types/database";

// Categories matching one of these (case-insensitive slug substring) are pinned
// to the front of the list, in this order, regardless of their stored
// sort_order. Everything else keeps its normal sort_order ordering. This drives
// both the public catalogue filter and the admin category dropdown.
const PINNED_CATEGORY_SLUGS = ["puffer"];

function categoryRank(slug: string): number {
  const s = (slug ?? "").toLowerCase();
  const i = PINNED_CATEGORY_SLUGS.findIndex((p) => s.includes(p));
  return i === -1 ? PINNED_CATEGORY_SLUGS.length : i;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  const categories = data ?? [];
  // Stable reorder: pinned categories first, then by sort_order as before.
  return categories.slice().sort((a, b) => {
    const ra = categoryRank(a.slug);
    const rb = categoryRank(b.slug);
    if (ra !== rb) return ra - rb;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export async function getSpecies(options?: {
  categorySlug?: string;
  search?: string;
  availability?: AvailabilityStatus;
  featured?: boolean;
  bestSeller?: boolean;
  limit?: number;
}): Promise<SpeciesWithImages[]> {
  const supabase = await createServerSupabaseClient();

  const categorySlug =
    options?.categorySlug && options.categorySlug !== "all"
      ? options.categorySlug
      : null;

  // Use an inner join (`!inner`) on the category when filtering by its slug —
  // otherwise PostgREST filters the embedded category but returns ALL species.
  let query = supabase
    .from("species")
    .select(
      `
      *,
      category:categories${categorySlug ? "!inner" : ""}(*),
      images:species_images(*)
    `,
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "species_images" });

  if (categorySlug) {
    query = query.eq("category.slug", categorySlug);
  }
  if (options?.search) {
    query = query.or(
      `common_name.ilike.%${options.search}%,scientific_name.ilike.%${options.search}%`,
    );
  }
  if (options?.availability) {
    query = query.eq("availability", options.availability);
  }
  if (options?.featured !== undefined) {
    query = query.eq("featured", options.featured);
  }
  if (options?.bestSeller !== undefined) {
    query = query.eq("best_seller", options.bestSeller);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data as SpeciesWithImages[]) ?? [];
}

export async function getSpeciesBySlug(
  slug: string,
): Promise<SpeciesWithImages | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("species")
    .select(
      `
      *,
      category:categories(*),
      images:species_images(*)
    `,
    )
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "species_images" })
    .single();
  return data as SpeciesWithImages | null;
}

export async function getSpeciesById(
  id: string,
): Promise<SpeciesWithImages | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("species")
    .select(
      `
      *,
      category:categories(*),
      images:species_images(*)
    `,
    )
    .eq("id", id)
    .order("sort_order", { referencedTable: "species_images" })
    .single();
  return data as SpeciesWithImages | null;
}
