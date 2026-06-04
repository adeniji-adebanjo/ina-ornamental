/**
 * Legacy Data Migration Script
 *
 * Fetches fish species data from legacy Google Sheets API and
 * imports it into the Supabase database.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-data.ts
 *
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const CATALOGUE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxt7zdT9AI4m3So--uVHcP-BRSTaQMBwL0xeNYt2SObVsb35YNGQDNQ_v0RkzJQB7fm/exec";

const ORDER_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxILPHJyX593opKRpyLcGz7hws6fKx1ytw8Yz05XXFsScD1KFqWaFUOjO_rQ2b7ynK9Vg/exec";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface LegacyFish {
  name: string;
  sci: string;
  category: string;
  description?: string;
  sizes: string;
  qty_bx?: string;
  origin?: string;
  images: string;
  best_seller?: boolean | string;
}

async function fetchLegacyData(url: string): Promise<LegacyFish[]> {
  console.log(`Fetching data from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  console.log(`Fetched ${data.length} records`);
  return data;
}

async function ensureCategory(
  categoryName: string,
  categoryCache: Map<string, string>,
): Promise<string> {
  const normalized = categoryName.trim();
  if (categoryCache.has(normalized)) {
    return categoryCache.get(normalized)!;
  }

  // Check if category exists
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("name", normalized)
    .single();

  if (existing) {
    categoryCache.set(normalized, existing.id);
    return existing.id;
  }

  // Create category
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ name: normalized, slug })
    .select("id")
    .single();

  if (error)
    throw new Error(
      `Failed to create category "${normalized}": ${error.message}`,
    );
  categoryCache.set(normalized, created!.id);
  return created!.id;
}

function parseImageUrls(images: string): string[] {
  if (!images) return [];
  return images
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

function parseSizes(sizes: string): string[] {
  if (!sizes) return [];
  return sizes
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function migrate() {
  console.log("Starting legacy data migration...\n");

  // Try catalogue URL first, fall back to order URL
  let data: LegacyFish[];
  try {
    data = await fetchLegacyData(CATALOGUE_SHEET_URL);
  } catch {
    console.log("Catalogue URL failed, trying order sheet URL...");
    data = await fetchLegacyData(ORDER_SHEET_URL);
  }

  if (!data || data.length === 0) {
    console.log("No data found. Exiting.");
    return;
  }

  // Print sample record
  console.log("\nSample record:", JSON.stringify(data[0], null, 2));

  const categoryCache = new Map<string, string>();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const fish of data) {
    try {
      const categoryId = fish.category
        ? await ensureCategory(fish.category, categoryCache)
        : null;

      // Check if species already exists by name
      const { data: existing } = await supabase
        .from("species")
        .select("id")
        .eq("common_name", fish.name)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      const sizes = parseSizes(fish.sizes);
      const isBestSeller =
        fish.best_seller === true ||
        fish.best_seller === "TRUE" ||
        fish.best_seller === "true";

      // Insert species
      const { data: species, error: speciesError } = await supabase
        .from("species")
        .insert({
          common_name: fish.name,
          scientific_name: fish.sci || null,
          category_id: categoryId,
          description: fish.description || null,
          sizes: sizes.length > 0 ? sizes : null,
          quantity_per_box: fish.qty_bx || null,
          origin: fish.origin || null,
          is_featured: isBestSeller,
          active: true,
        })
        .select("id")
        .single();

      if (speciesError) {
        console.error(
          `Error inserting "${fish.name}": ${speciesError.message}`,
        );
        errors++;
        continue;
      }

      // Insert images
      const imageUrls = parseImageUrls(fish.images);
      if (imageUrls.length > 0 && species) {
        const imageRecords = imageUrls.map((url, i) => ({
          species_id: species.id,
          url,
          sort_order: i,
        }));

        const { error: imgError } = await supabase
          .from("species_images")
          .insert(imageRecords);

        if (imgError) {
          console.error(
            `Error inserting images for "${fish.name}": ${imgError.message}`,
          );
        }
      }

      created++;
      if (created % 10 === 0) console.log(`  Imported ${created} species...`);
    } catch (err) {
      console.error(`Error processing "${fish.name}":`, err);
      errors++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Categories: ${categoryCache.size}`);
}

migrate().catch(console.error);
