import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

interface ExportRow {
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: { name: string } | null;
  class_order: string | null;
  origin: string | null;
  description: string | null;
  sizes: string[] | null;
  tags: string[] | null;
  qty_per_box: number | null;
  availability: string | null;
  featured: boolean | null;
  best_seller: boolean | null;
  sort_order: number | null;
  images: { image_url: string; sort_order: number | null }[] | null;
}

export async function GET() {
  // Require an authenticated admin — this endpoint uses the service-role key.
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("species")
    .select(
      "slug, common_name, scientific_name, class_order, origin, description, sizes, tags, qty_per_box, availability, featured, best_seller, sort_order, category:categories(name), images:species_images(image_url, sort_order)",
    )
    .order("sort_order");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "slug",
    "common_name",
    "scientific_name",
    "category",
    "class_order",
    "origin",
    "description",
    "sizes",
    "tags",
    "qty_per_box",
    "availability",
    "featured",
    "best_seller",
    "sort_order",
    "image_urls",
  ];

  const rows = ((data as unknown as ExportRow[]) ?? []).map((s) => {
    const images = (s.images ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i) => i.image_url);
    return [
      s.slug,
      s.common_name,
      s.scientific_name ?? "",
      s.category?.name ?? "",
      s.class_order ?? "",
      s.origin ?? "",
      s.description ?? "",
      (s.sizes ?? []).join("|"),
      (s.tags ?? []).join("|"),
      s.qty_per_box ?? 1,
      s.availability ?? "on_request",
      s.featured ? "yes" : "no",
      s.best_seller ? "yes" : "no",
      s.sort_order ?? 0,
      images.join("|"),
    ];
  });

  // Prepend a BOM so Excel opens UTF-8 correctly.
  const csv = "﻿" + toCsv([headers, ...rows]);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ina-species-${date}.csv"`,
    },
  });
}
