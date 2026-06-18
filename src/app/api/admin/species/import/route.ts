import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";

const AVAILABILITY = [
  "available",
  "limited_stock",
  "out_of_stock",
  "seasonal",
  "on_request",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBool(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

function parseList(v: string): string[] {
  return v
    .split(/[|;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2)
    return NextResponse.json(
      { error: "CSV has no data rows" },
      { status: 400 },
    );

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const idx = {
    slug: col("slug"),
    common_name: col("common_name", "name", "common name"),
    scientific_name: col("scientific_name", "scientific name"),
    category: col("category", "class"),
    class_order: col("class_order", "class/order"),
    origin: col("origin"),
    description: col("description"),
    sizes: col("sizes", "size"),
    tags: col("tags"),
    qty_per_box: col("qty_per_box", "qty per box", "qty"),
    availability: col("availability"),
    featured: col("featured"),
    best_seller: col("best_seller", "best seller", "bestseller"),
    sort_order: col("sort_order", "sort order"),
    image_urls: col("image_urls", "images", "image"),
  };

  if (idx.common_name < 0) {
    return NextResponse.json(
      { error: "Missing required column: common_name (or name)" },
      { status: 400 },
    );
  }

  const admin = await createAdminSupabaseClient();
  const get = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");

  // Preload categories (name/slug → id) and existing species slugs.
  const { data: cats } = await admin
    .from("categories")
    .select("id, name, slug");
  const catMap = new Map<string, string>();
  for (const c of cats ?? []) {
    if (c.name) catMap.set(c.name.toLowerCase(), c.id);
    if (c.slug) catMap.set(c.slug.toLowerCase(), c.id);
  }
  let nextCatSort = (cats ?? []).length;

  const { data: existing } = await admin.from("species").select("slug");
  const existingSlugs = new Set((existing ?? []).map((s) => s.slug));

  const errors: string[] = [];
  let created = 0;
  let updated = 0;
  let imagesSet = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const common_name = get(row, idx.common_name);
    if (!common_name) {
      errors.push(`Row ${r + 1}: missing common_name`);
      continue;
    }

    const slug = get(row, idx.slug) || slugify(common_name);

    // Resolve category by name/slug, creating it if it doesn't exist yet.
    let category_id: string | null = null;
    const catName = get(row, idx.category);
    if (catName) {
      const key = catName.toLowerCase();
      category_id = catMap.get(key) ?? null;
      if (!category_id) {
        const catSlug = slugify(catName);
        const { data: newCat } = await admin
          .from("categories")
          .upsert(
            { name: catName, slug: catSlug, sort_order: nextCatSort++ },
            { onConflict: "slug" },
          )
          .select("id")
          .single();
        if (newCat) {
          category_id = newCat.id;
          catMap.set(key, newCat.id);
          catMap.set(catSlug, newCat.id);
        }
      }
    }

    const availRaw = get(row, idx.availability)
      .toLowerCase()
      .replace(/\s+/g, "_");
    const availability = AVAILABILITY.includes(availRaw)
      ? availRaw
      : "on_request";

    const qty = parseInt(get(row, idx.qty_per_box), 10);
    const sort = parseInt(get(row, idx.sort_order), 10);

    const record = {
      slug,
      common_name,
      scientific_name: get(row, idx.scientific_name) || null,
      category_id,
      class_order: get(row, idx.class_order) || null,
      origin: get(row, idx.origin) || "West Africa",
      description: get(row, idx.description) || null,
      sizes: parseList(get(row, idx.sizes)),
      tags: parseList(get(row, idx.tags)),
      qty_per_box: Number.isFinite(qty) && qty > 0 ? qty : 1,
      availability,
      featured: idx.featured >= 0 ? parseBool(get(row, idx.featured)) : false,
      best_seller:
        idx.best_seller >= 0 ? parseBool(get(row, idx.best_seller)) : false,
      sort_order: Number.isFinite(sort) ? sort : 0,
    };

    const wasExisting = existingSlugs.has(slug);

    const { data: saved, error } = await admin
      .from("species")
      .upsert(record, { onConflict: "slug" })
      .select("id")
      .single();

    if (error || !saved) {
      errors.push(`Row ${r + 1} (${common_name}): ${error?.message ?? "save failed"}`);
      continue;
    }

    if (wasExisting) updated++;
    else {
      created++;
      existingSlugs.add(slug);
    }

    // Replace the image set only when an image_urls column is provided with values.
    if (idx.image_urls >= 0) {
      const urls = parseList(get(row, idx.image_urls));
      if (urls.length > 0) {
        await admin.from("species_images").delete().eq("species_id", saved.id);
        const imgRows = urls.map((url, i) => ({
          species_id: saved.id,
          image_url: url,
          sort_order: i,
        }));
        const { error: imgErr } = await admin
          .from("species_images")
          .insert(imgRows);
        if (!imgErr) imagesSet += urls.length;
      }
    }
  }

  return NextResponse.json({
    success: true,
    created,
    updated,
    imagesSet,
    errors: errors.length ? errors : undefined,
  });
}
