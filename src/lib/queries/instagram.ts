import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { InstagramPost } from "@/types/database";

// Behold.so proxies the Instagram feed and handles all token refresh, so no
// Instagram access token is needed here — just the feed URL.
const BEHOLD_FEED_URL = process.env.BEHOLD_FEED_URL;

interface BeholdChild {
  mediaType?: string;
  mediaUrl?: string;
}

interface BeholdPost {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  children?: BeholdChild[];
}

interface BeholdFeed {
  posts?: BeholdPost[];
}

function mapBeholdPosts(posts: BeholdPost[]): InstagramPost[] {
  return posts.map((post) => ({
    id: post.id,
    media_type: post.mediaType,
    media_url: post.mediaUrl,
    thumbnail_url: post.thumbnailUrl ?? null,
    permalink: post.permalink ?? null,
    caption: post.caption ?? null,
    timestamp: post.timestamp ?? null,
    carousel_items:
      post.children && post.children.length > 0
        ? post.children.map((c) => ({
            media_url: c.mediaUrl ?? "",
            media_type: c.mediaType ?? "IMAGE",
          }))
        : null,
    cached_at: new Date().toISOString(),
  }));
}

async function fetchBeholdFeed(): Promise<InstagramPost[]> {
  if (!BEHOLD_FEED_URL) {
    throw new Error("BEHOLD_FEED_URL is not configured");
  }
  const res = await fetch(BEHOLD_FEED_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Behold feed error: ${res.status} ${await res.text()}`);
  }
  const feed = (await res.json()) as BeholdFeed;
  return mapBeholdPosts(feed.posts ?? []);
}

/**
 * Fetch the Instagram feed from Behold.so and cache it in `instagram_posts`.
 * Uses the service-role client so it works from a cron job (no RLS session).
 * Returns the number of posts synced.
 */
export async function syncInstagramPosts(): Promise<number> {
  const rows = await fetchBeholdFeed();

  if (rows.length > 0) {
    const admin = await createAdminSupabaseClient();
    const { error } = await admin
      .from("instagram_posts")
      .upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  return rows.length;
}

/**
 * Posts for the public gallery. Reads the admin-managed cache first (it
 * accumulates across syncs); if the cache is empty, falls back to a live Behold
 * fetch so the gallery still renders without requiring a manual sync.
 */
export async function getInstagramPosts(limit = 60): Promise<InstagramPost[]> {
  // Service-role read (server-side only) so the public gallery shows the same
  // posts as the admin, independent of RLS. Instagram content is public.
  const supabase = await createAdminSupabaseClient();
  const { data } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  const cached = (data as InstagramPost[]) ?? [];
  if (cached.length > 0) return cached;

  // Cache empty (no sync has run yet) — best-effort live fetch; never throw on
  // the public page.
  if (!BEHOLD_FEED_URL) return [];
  try {
    return (await fetchBeholdFeed()).slice(0, limit);
  } catch {
    return [];
  }
}
