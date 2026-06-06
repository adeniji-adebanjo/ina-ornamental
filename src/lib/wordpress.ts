import { FishProduct, WPProduct } from "@/types";

const WP_API_URL = process.env.NEXT_PUBLIC_WP_API_URL;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function mapWPProductToFish(wp: WPProduct): FishProduct {
  const acf = wp.acf || {};
  const media = wp._embedded?.["wp:featuredmedia"]?.[0];

  return {
    id: wp.id,
    slug: wp.slug,
    commonName: stripHtml(wp.title.rendered),
    scientificName: acf.scientific_name || "",
    category: acf.category || "Oddballs",
    classOrder: acf.class_order || "",
    description: stripHtml(wp.excerpt?.rendered || wp.content?.rendered || ""),
    imageUrl: media?.source_url || "/images/fish-placeholder.svg",
    sizes: acf.sizes ? acf.sizes.split(",").map((s: string) => s.trim()) : [],
    tags: acf.tags ? acf.tags.split(",").map((t: string) => t.trim()) : [],
    inStock: acf.in_stock !== false,
    featured: acf.featured === true,
    availability: "available" as const,
    qtyPerBox: acf.qty_per_box ? Number(acf.qty_per_box) : 1,
  };
}

export async function fetchProducts(): Promise<FishProduct[]> {
  if (!WP_API_URL) return [];

  try {
    const res = await fetch(
      `${WP_API_URL}/wp-json/wp/v2/fish-product?per_page=100&_embed`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) return [];

    const data: WPProduct[] = await res.json();
    return data.map(mapWPProductToFish);
  } catch {
    return [];
  }
}

export async function fetchProductBySlug(
  slug: string,
): Promise<FishProduct | null> {
  if (!WP_API_URL) return null;

  try {
    const res = await fetch(
      `${WP_API_URL}/wp-json/wp/v2/fish-product?slug=${encodeURIComponent(slug)}&_embed`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) return null;

    const data: WPProduct[] = await res.json();
    if (data.length === 0) return null;

    return mapWPProductToFish(data[0]);
  } catch {
    return null;
  }
}

export async function fetchCategories(): Promise<string[]> {
  if (!WP_API_URL) return [];

  try {
    const res = await fetch(
      `${WP_API_URL}/wp-json/wp/v2/fish-category?per_page=50`,
      { next: { revalidate: 600 } },
    );

    if (!res.ok) return [];

    const data: Array<{ name: string }> = await res.json();
    return data.map((cat) => cat.name);
  } catch {
    return [];
  }
}
