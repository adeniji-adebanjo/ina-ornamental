import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";
import { loadWorkbook, cellText } from "@/lib/excel";

// ExcelJS needs Node APIs (stream/Buffer), and a large sheet shouldn't be cut
// off by the platform's default function timeout.
export const runtime = "nodejs";
export const maxDuration = 60;

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

  // Accept both CSV and Excel (.xlsx/.xls). loadWorkbook reads either into a
  // worksheet; flatten the first sheet into rows of trimmed cell text so the
  // rest of the parsing stays format-agnostic.
  const workbook = await loadWorkbook(file);
  const ws = workbook.worksheets[0];
  if (!ws)
    return NextResponse.json(
      { error: "No worksheet found in the file." },
      { status: 400 },
    );

  const colCount = ws.columnCount;
  const allRows: string[][] = [];
  ws.eachRow((row) => {
    const cells: string[] = [];
    for (let c = 1; c <= colCount; c++) {
      cells.push(cellText(row.getCell(c).value));
    }
    allRows.push(cells);
  });
  const rows = allRows.filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2)
    return NextResponse.json(
      { error: "The file has no data rows. Add at least one species below the header." },
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

  // ── Pass 1: parse every row into a record (no DB writes yet) ───────────────
  type SpeciesRecord = {
    slug: string;
    common_name: string;
    scientific_name: string | null;
    category_id: string | null;
    class_order: string | null;
    origin: string;
    description: string | null;
    sizes: string[];
    tags: string[];
    qty_per_box: number;
    availability: string;
    featured: boolean;
    best_seller: boolean;
    sort_order: number;
  };
  type Parsed = { record: SpeciesRecord; catName: string; images: string[] };

  const parsed: Parsed[] = [];
  const newCats = new Map<string, string>(); // slug → display name

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const common_name = get(row, idx.common_name);
    if (!common_name) {
      errors.push(`Row ${r + 1}: missing common_name`);
      continue;
    }

    // Note any category that doesn't exist yet so we can create them in bulk.
    const catName = get(row, idx.category);
    if (catName && !catMap.has(catName.toLowerCase())) {
      const catSlug = slugify(catName);
      if (!newCats.has(catSlug)) newCats.set(catSlug, catName);
    }

    const availRaw = get(row, idx.availability)
      .toLowerCase()
      .replace(/\s+/g, "_");
    const availability = AVAILABILITY.includes(availRaw)
      ? availRaw
      : "on_request";

    const qty = parseInt(get(row, idx.qty_per_box), 10);
    const sort = parseInt(get(row, idx.sort_order), 10);

    parsed.push({
      record: {
        slug: get(row, idx.slug) || slugify(common_name),
        common_name,
        scientific_name: get(row, idx.scientific_name) || null,
        category_id: null, // resolved after categories are created
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
      },
      catName,
      images: idx.image_urls >= 0 ? parseList(get(row, idx.image_urls)) : [],
    });
  }

  // ── Create any new categories in one batch, then resolve category ids ──────
  if (newCats.size > 0) {
    const toCreate = Array.from(newCats.entries()).map(([slug, name]) => ({
      name,
      slug,
      sort_order: nextCatSort++,
    }));
    const { data: createdCats } = await admin
      .from("categories")
      .upsert(toCreate, { onConflict: "slug" })
      .select("id, name, slug");
    for (const c of createdCats ?? []) {
      if (c.name) catMap.set(c.name.toLowerCase(), c.id);
      if (c.slug) catMap.set(c.slug.toLowerCase(), c.id);
    }
  }
  for (const p of parsed) {
    if (p.catName) p.record.category_id = catMap.get(p.catName.toLowerCase()) ?? null;
  }

  // De-duplicate by slug (last occurrence wins) — a single upsert payload can't
  // touch the same conflict key twice.
  const bySlug = new Map<string, Parsed>();
  for (const p of parsed) bySlug.set(p.record.slug, p);
  const finalRecords = Array.from(bySlug.values());

  if (finalRecords.length === 0) {
    return NextResponse.json({
      success: true,
      created: 0,
      updated: 0,
      imagesSet: 0,
      errors: errors.length ? errors : undefined,
    });
  }

  // ── Bulk-upsert species in chunks, collecting the resulting slug → id map ──
  const CHUNK = 500;
  const slugToId = new Map<string, string>();
  for (let i = 0; i < finalRecords.length; i += CHUNK) {
    const chunk = finalRecords.slice(i, i + CHUNK).map((p) => p.record);
    const { data: saved, error } = await admin
      .from("species")
      .upsert(chunk, { onConflict: "slug" })
      .select("id, slug");
    if (error) {
      return NextResponse.json(
        { error: `Couldn't save species: ${error.message}` },
        { status: 400 },
      );
    }
    for (const s of saved ?? []) slugToId.set(s.slug, s.id);
  }

  let created = 0;
  let updated = 0;
  for (const p of finalRecords) {
    if (existingSlugs.has(p.record.slug)) updated++;
    else created++;
  }

  // ── Replace images in bulk, only for rows that supplied image urls ─────────
  let imagesSet = 0;
  if (idx.image_urls >= 0) {
    const idsToClear: string[] = [];
    const imgRows: {
      species_id: string;
      image_url: string;
      sort_order: number;
    }[] = [];
    for (const p of finalRecords) {
      if (p.images.length === 0) continue;
      const id = slugToId.get(p.record.slug);
      if (!id) continue;
      idsToClear.push(id);
      p.images.forEach((url, i) =>
        imgRows.push({ species_id: id, image_url: url, sort_order: i }),
      );
    }
    for (let i = 0; i < idsToClear.length; i += CHUNK) {
      await admin
        .from("species_images")
        .delete()
        .in("species_id", idsToClear.slice(i, i + CHUNK));
    }
    for (let i = 0; i < imgRows.length; i += CHUNK) {
      const chunk = imgRows.slice(i, i + CHUNK);
      const { error: imgErr } = await admin
        .from("species_images")
        .insert(chunk);
      if (!imgErr) imagesSet += chunk.length;
    }
  }

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json({
    success: true,
    created,
    updated,
    imagesSet,
    errors: errors.length ? errors : undefined,
  });
}
