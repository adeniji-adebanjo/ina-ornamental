import type { MetadataRoute } from "next";
import { fetchPosts } from "@/lib/blog";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inaornamentalfish.com";

// Re-generate hourly so newly published blog posts get listed.
export const revalidate = 3600;

// WordPress caps per_page at 100; page through so every post is listed.
const WP_PAGE_SIZE = 100;
const MAX_PAGES = 20;

async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { posts, totalPages } = await fetchPosts({
      page,
      perPage: WP_PAGE_SIZE,
      revalidate,
    });
    for (const post of posts) {
      const lastModified = post.modified || post.date;
      entries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    if (page >= totalPages) break;
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages carry no lastModified: we have no real date for them, and a
  // per-request `new Date()` just tells crawlers everything changed.
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/order`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/track`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...staticPages, ...(await blogEntries())];
}
