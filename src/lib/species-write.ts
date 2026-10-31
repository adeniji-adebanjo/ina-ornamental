// Shared validation + image handling for the admin species create/update
// routes. The request body is never passed straight to the database: only the
// editable columns below are copied, so a client can't set id, created_at, etc.
import type { SupabaseClient } from "@supabase/supabase-js";

const AVAILABILITY = new Set([
  "available",
  "limited_stock",
  "out_of_stock",
  "seasonal",
  "on_request",
]);

const TEXT_FIELDS = [
  "slug",
  "common_name",
  "scientific_name",
  "category_id",
  "class_order",
  "description",
  "origin",
] as const;

export function pickSpeciesFields(
  body: Record<string, unknown>,
): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};

  for (const key of TEXT_FIELDS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v !== null && typeof v !== "string")
      return { error: `${key} must be text` };
    data[key] = typeof v === "string" ? v.trim() || null : null;
  }
  if ("common_name" in data && !data.common_name)
    return { error: "Common name is required" };
  if ("slug" in data && !data.slug) return { error: "Slug is required" };

  for (const key of ["sizes", "tags"] as const) {
    if (!(key in body)) continue;
    const v = body[key];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
      return { error: `${key} must be a list of text values` };
    data[key] = (v as string[]).map((s) => s.trim()).filter(Boolean);
  }

  for (const key of ["qty_per_box", "sort_order"] as const) {
    if (!(key in body)) continue;
    const n = Number(body[key]);
    if (!Number.isInteger(n) || (key === "qty_per_box" ? n < 1 : n < 0))
      return {
        error:
          key === "qty_per_box"
            ? "Qty per box must be a whole number of at least 1"
            : "Sort order must be a whole number",
      };
    data[key] = n;
  }

  for (const key of ["featured", "best_seller"] as const) {
    if (key in body) data[key] = body[key] === true;
  }

  if ("availability" in body) {
    if (!AVAILABILITY.has(String(body.availability)))
      return { error: "Unknown availability value" };
    data.availability = body.availability;
  }

  return { data };
}

export function parseImageUrls(v: unknown): string[] | null | { error: string } {
  if (v === undefined) return null; // not provided → leave images alone
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
    return { error: "image_urls must be a list of URLs" };
  return (v as string[]).map((s) => s.trim()).filter(Boolean);
}

/**
 * Replace a species' images without a window where it has none: insert the
 * new set, then delete the previous rows by id. If the insert fails the old
 * images are untouched.
 */
export async function replaceSpeciesImages(
  admin: SupabaseClient,
  speciesId: string,
  urls: string[],
): Promise<string | null> {
  const { data: old, error: oldErr } = await admin
    .from("species_images")
    .select("id")
    .eq("species_id", speciesId);
  if (oldErr) return oldErr.message;

  if (urls.length > 0) {
    const { error: insErr } = await admin.from("species_images").insert(
      urls.map((url, i) => ({
        species_id: speciesId,
        image_url: url,
        sort_order: i,
      })),
    );
    if (insErr) return insErr.message;
  }

  const oldIds = (old ?? []).map((r) => r.id);
  if (oldIds.length) {
    const { error: delErr } = await admin
      .from("species_images")
      .delete()
      .in("id", oldIds);
    if (delErr) return delErr.message;
  }
  return null;
}
