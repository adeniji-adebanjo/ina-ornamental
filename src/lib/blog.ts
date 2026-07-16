import { sanitizeHtml } from "@/lib/sanitize-html";
import type {
  BlogCategory,
  BlogPost,
  BlogPostInput,
  BlogStatus,
  WPCategory,
  WPPost,
} from "@/types";

/**
 * WordPress headless-CMS blog client.
 *
 * Reads are public and fail soft (return [] / null) when the CMS is
 * unconfigured or unreachable, so the site renders an empty state instead of
 * crashing. Writes require Application Password credentials and are only ever
 * called from server-side admin API routes (never the browser).
 */

// Site root, e.g. https://cms.inaornamental.com — NO trailing /wp-json.
const WP_SITE_URL = (process.env.WP_API_URL || "").replace(/\/+$/, "");
const WP_USERNAME = process.env.WP_USERNAME || "";
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || "";

const WP_V2 = `${WP_SITE_URL}/wp-json/wp/v2`;

export function isBlogConfigured(): boolean {
  return Boolean(WP_SITE_URL);
}

export function isBlogWritable(): boolean {
  return Boolean(WP_SITE_URL && WP_USERNAME && WP_APP_PASSWORD);
}

function authHeader(): string {
  if (!isBlogWritable()) {
    throw new Error(
      "WordPress writeback is not configured. Set WP_API_URL, WP_USERNAME and WP_APP_PASSWORD.",
    );
  }
  const token = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString(
    "base64",
  );
  return `Basic ${token}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function mapStatus(status: string): BlogStatus {
  return status === "publish" ? "publish" : "draft";
}

function mapCategory(wp: WPCategory): BlogCategory {
  return {
    id: wp.id,
    name: wp.name,
    slug: wp.slug,
    count: wp.count ?? 0,
  };
}

function mapPost(wp: WPPost): BlogPost {
  const media = wp._embedded?.["wp:featuredmedia"]?.[0];
  const terms = wp._embedded?.["wp:term"]?.flat() ?? [];
  const categories: BlogCategory[] = terms
    .filter((t) => wp.categories?.includes(t.id))
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: 0 }));

  return {
    id: wp.id,
    slug: wp.slug,
    title: stripHtml(wp.title?.rendered || "Untitled"),
    // Sanitize on output — the body is rendered via dangerouslySetInnerHTML.
    content: sanitizeHtml(wp.content?.rendered || ""),
    excerpt: stripHtml(wp.excerpt?.rendered || ""),
    status: mapStatus(wp.status),
    date: wp.date,
    modified: wp.modified,
    featuredImageUrl: media?.source_url || null,
    featuredImageAlt: media?.alt_text || "",
    categories,
    authorName: wp._embedded?.author?.[0]?.name || "",
  };
}

// ─── Public reads ────────────────────────────────────────────────────────────

export interface FetchPostsOptions {
  page?: number;
  perPage?: number;
  categoryId?: number;
  search?: string;
  /** Include drafts (admin only). Defaults to published-only. */
  status?: "publish" | "any";
  /** ISR window in seconds (public reads). Omit for no-store (admin reads). */
  revalidate?: number;
}

export interface FetchPostsResult {
  posts: BlogPost[];
  total: number;
  totalPages: number;
}

export async function fetchPosts(
  opts: FetchPostsOptions = {},
): Promise<FetchPostsResult> {
  const empty: FetchPostsResult = { posts: [], total: 0, totalPages: 0 };
  if (!isBlogConfigured()) return empty;

  const {
    page = 1,
    perPage = 12,
    categoryId,
    search,
    status = "publish",
    revalidate,
  } = opts;

  const params = new URLSearchParams({
    _embed: "1",
    page: String(page),
    per_page: String(perPage),
    orderby: "date",
    order: "desc",
  });
  if (categoryId) params.set("categories", String(categoryId));
  if (search) params.set("search", search);

  // Drafts require auth; published listing stays anonymous + ISR-cached.
  const wantsDrafts = status === "any";
  if (wantsDrafts) params.set("status", "any");
  else params.set("status", "publish");

  try {
    const res = await fetch(`${WP_V2}/posts?${params.toString()}`, {
      headers: wantsDrafts ? { Authorization: authHeader() } : undefined,
      ...(wantsDrafts
        ? { cache: "no-store" }
        : { next: { revalidate: revalidate ?? 300 } }),
    });
    if (!res.ok) return empty;

    const data: WPPost[] = await res.json();
    return {
      posts: data.map(mapPost),
      total: Number(res.headers.get("X-WP-Total") || data.length),
      totalPages: Number(res.headers.get("X-WP-TotalPages") || 1),
    };
  } catch {
    return empty;
  }
}

export async function fetchPostBySlug(
  slug: string,
  opts: { revalidate?: number } = {},
): Promise<BlogPost | null> {
  if (!isBlogConfigured()) return null;
  try {
    const res = await fetch(
      `${WP_V2}/posts?slug=${encodeURIComponent(slug)}&_embed=1`,
      { next: { revalidate: opts.revalidate ?? 300 } },
    );
    if (!res.ok) return null;
    const data: WPPost[] = await res.json();
    if (!data.length) return null;
    return mapPost(data[0]);
  } catch {
    return null;
  }
}

/** Fetch a single post by id including draft content (admin editing). */
export async function fetchPostById(id: number): Promise<BlogPost | null> {
  if (!isBlogWritable()) return null;
  try {
    const res = await fetch(`${WP_V2}/posts/${id}?_embed=1&context=edit`, {
      headers: { Authorization: authHeader() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: WPPost & { content: { raw?: string } } = await res.json();
    const post = mapPost(data);
    // In edit context WP returns the raw (unfiltered) body — prefer it so the
    // editor round-trips exactly what was saved.
    if (data.content?.raw !== undefined) post.content = data.content.raw;
    return post;
  } catch {
    return null;
  }
}

export async function fetchCategories(opts: {
  revalidate?: number;
  fresh?: boolean;
} = {}): Promise<BlogCategory[]> {
  if (!isBlogConfigured()) return [];
  try {
    const res = await fetch(
      `${WP_V2}/categories?per_page=100&orderby=name&order=asc&hide_empty=false`,
      opts.fresh
        ? { cache: "no-store" }
        : { next: { revalidate: opts.revalidate ?? 600 } },
    );
    if (!res.ok) return [];
    const data: WPCategory[] = await res.json();
    return data.map(mapCategory);
  } catch {
    return [];
  }
}

// ─── Writeback (admin, server only) ──────────────────────────────────────────

async function wpWrite<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${WP_V2}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json && (json.message as string)) ||
      `WordPress request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const data = await wpWrite<WPPost>("/posts?_embed=1", "POST", input);
  return mapPost(data);
}

export async function updatePost(
  id: number,
  input: Partial<BlogPostInput>,
): Promise<BlogPost> {
  const data = await wpWrite<WPPost>(`/posts/${id}?_embed=1`, "PUT", input);
  return mapPost(data);
}

export async function deletePost(id: number): Promise<void> {
  // force=true skips trash and deletes permanently.
  await wpWrite(`/posts/${id}?force=true`, "DELETE");
}

export async function createCategory(name: string): Promise<BlogCategory> {
  const data = await wpWrite<WPCategory>("/categories", "POST", { name });
  return mapCategory(data);
}

export async function updateCategory(
  id: number,
  name: string,
): Promise<BlogCategory> {
  const data = await wpWrite<WPCategory>(`/categories/${id}`, "PUT", { name });
  return mapCategory(data);
}

export async function deleteCategory(id: number): Promise<void> {
  await wpWrite(`/categories/${id}?force=true`, "DELETE");
}

export interface UploadedMedia {
  id: number;
  source_url: string;
  alt_text: string;
}

/** Upload a file to the WP media library. Returns the new attachment. */
export async function uploadMedia(
  file: File,
  filename: string,
): Promise<UploadedMedia> {
  const res = await fetch(`${WP_V2}/media`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json && (json.message as string)) ||
        `Media upload failed (${res.status})`,
    );
  }
  return {
    id: json.id,
    source_url: json.source_url,
    alt_text: json.alt_text || "",
  };
}
