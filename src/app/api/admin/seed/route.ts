import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxt7zdT9AI4m3So--uVHcP-BRSTaQMBwL0xeNYt2SObVsb35YNGQDNQ_v0RkzJQB7fm/exec";

// Behavioral tags that should NOT be categories — they become tags instead
const BEHAVIORAL_TAGS = new Set(["aggressive", "gentle", "cute", "monster"]);

// Placeholder image to skip
const PLACEHOLDER_IMAGE = "cropped-cropped-cropped-without-backgound-2022.png";

interface SheetFish {
  name: string;
  sci: string;
  category: string;
  sizes: string;
  qty_bx: number | string;
  images: string;
  best_seller: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse a size string like "4cm to 6cm" or "18cm to 28cm" into an array of size labels.
 */
function parseSizes(sizeStr: string): string[] {
  if (!sizeStr || sizeStr === "-") return [];
  // Return the raw size range as a single entry — admin can refine later
  return [sizeStr.trim()];
}

/**
 * Parse comma-separated categories into { primaryCategory, tags }.
 * Behavioral words become tags; the first taxonomic word becomes the category.
 */
function parseCategories(catStr: string): {
  category: string | null;
  tags: string[];
} {
  if (!catStr) return { category: null, tags: [] };
  const parts = catStr.split(",").map((c) => c.trim());
  const tags: string[] = [];
  let category: string | null = null;

  for (const part of parts) {
    if (BEHAVIORAL_TAGS.has(part.toLowerCase())) {
      // Capitalise behavioral tag
      tags.push(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    } else if (!category) {
      category = part;
    } else {
      // Extra non-behavioral parts also become tags
      tags.push(part);
    }
  }

  return { category, tags };
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();

  // Check if species already exist
  const { count } = await admin
    .from("species")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json(
      { error: "Species data already exists. Clear existing data first." },
      { status: 400 },
    );
  }

  // Fetch live catalogue from Google Sheet
  let fishData: SheetFish[];
  try {
    const res = await fetch(GOOGLE_SHEET_URL);
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    fishData = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch catalogue: ${err}` },
      { status: 502 },
    );
  }

  // ── Build categories ──────────────────────────────────────────────────
  const categoryNames = new Set<string>();
  for (const f of fishData) {
    const { category } = parseCategories(f.category);
    if (category) categoryNames.add(category);
  }

  const categoryMap: Record<string, string> = {};
  let sortIdx = 0;
  for (const name of categoryNames) {
    const { data, error } = await admin
      .from("categories")
      .upsert(
        { name, slug: slugify(name), sort_order: sortIdx++ },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (!error && data) categoryMap[name] = data.id;
  }

  // ── Insert species + images ───────────────────────────────────────────
  let created = 0;
  let imagesCreated = 0;

  for (let i = 0; i < fishData.length; i++) {
    const f = fishData[i];
    const { category, tags } = parseCategories(f.category);
    const isBestSeller =
      String(f.best_seller || "").toLowerCase() === "yes" ||
      String(f.best_seller || "").toLowerCase() === "true";

    const slug = slugify(f.name);
    const qtyPerBox =
      typeof f.qty_bx === "number"
        ? f.qty_bx
        : parseInt(String(f.qty_bx), 10) || 1;

    const { data: species, error } = await admin
      .from("species")
      .upsert(
        {
          slug,
          common_name: f.name,
          scientific_name: f.sci || null,
          category_id: category ? (categoryMap[category] ?? null) : null,
          origin: "West Africa",
          sizes: parseSizes(f.sizes),
          tags,
          qty_per_box: qtyPerBox,
          availability: "available" as const,
          featured: isBestSeller,
          best_seller: isBestSeller,
          sort_order: i,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !species) continue;
    created++;

    // Insert images (skip placeholder logos)
    if (f.images) {
      const imageUrls = f.images
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u && !u.includes(PLACEHOLDER_IMAGE));

      for (let j = 0; j < imageUrls.length; j++) {
        const { error: imgErr } = await admin.from("species_images").insert({
          species_id: species.id,
          image_url: imageUrls[j],
          alt_text: f.name,
          sort_order: j,
        });
        if (!imgErr) imagesCreated++;
      }
    }
  }

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json({
    success: true,
    categories: categoryNames.size,
    species: created,
    images: imagesCreated,
  });
}
