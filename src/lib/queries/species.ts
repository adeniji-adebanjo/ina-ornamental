import {
  createPublicSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SpeciesWithImages,
  Category,
  AvailabilityStatus,
} from "@/types/database";

// Shared cache tag for the public catalogue data (species + categories). Write
// routes call revalidateTag("catalog") to drop these caches on change. A 60s
// TTL bounds staleness even if a write path forgets to revalidate.
export const CATALOG_TAG = "catalog";
const CATALOG_TTL_S = 60;

interface GetSpeciesOptions {
  categorySlug?: string;
  search?: string;
  availability?: AvailabilityStatus;
  featured?: boolean;
  bestSeller?: boolean;
  limit?: number;
}

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

async function queryCategories(supabase: SupabaseClient): Promise<Category[]> {
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

// Cached public read — served from the data cache unless "catalog" is
// revalidated or the 60s TTL lapses.
export const getCategories = unstable_cache(
  async () => queryCategories(await createPublicSupabaseClient()),
  ["categories"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_TTL_S },
);

// Fresh (uncached) read for admin pages, which must reflect edits immediately.
export async function getCategoriesUncached(): Promise<Category[]> {
  return queryCategories(await createServerSupabaseClient());
}

async function querySpecies(
  supabase: SupabaseClient,
  options?: GetSpeciesOptions,
): Promise<SpeciesWithImages[]> {
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
    // Strip PostgREST-structural characters so the term can't break out of the
    // intended `or(...)` filter (comma/parens/wildcards/quotes/backslash).
    const safe = options.search.replace(/[,()*%"'\\]/g, " ").trim();
    if (safe) {
      query = query.or(
        `common_name.ilike.%${safe}%,scientific_name.ilike.%${safe}%`,
      );
    }
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

// Cached public read. unstable_cache keys on the serialized options, so each
// filter combination is cached (and tagged) independently.
export const getSpecies = unstable_cache(
  async (options?: GetSpeciesOptions) =>
    querySpecies(await createPublicSupabaseClient(), options),
  ["species"],
  { tags: [CATALOG_TAG], revalidate: CATALOG_TTL_S },
);

// Fresh (uncached) read for admin pages, which must reflect edits immediately.
export async function getSpeciesUncached(
  options?: GetSpeciesOptions,
): Promise<SpeciesWithImages[]> {
  return querySpecies(await createServerSupabaseClient(), options);
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
