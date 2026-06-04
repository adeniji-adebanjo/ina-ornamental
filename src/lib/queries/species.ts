import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  SpeciesWithImages,
  Category,
  AvailabilityStatus,
} from "@/types/database";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
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

  let query = supabase
    .from("species")
    .select(
      `
      *,
      category:categories(*),
      images:species_images(*)
    `,
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "species_images" });

  if (options?.categorySlug && options.categorySlug !== "all") {
    query = query.eq("category.slug", options.categorySlug);
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
