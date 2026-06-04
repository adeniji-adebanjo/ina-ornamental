import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InstagramPost } from "@/types/database";

const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

interface IGMediaResponse {
  data: {
    id: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    caption?: string;
    timestamp: string;
    children?: {
      data: { id: string; media_type: string; media_url: string }[];
    };
  }[];
  paging?: { cursors: { after: string }; next: string };
}

export async function syncInstagramPosts(): Promise<void> {
  if (!INSTAGRAM_TOKEN || !INSTAGRAM_USER_ID) return;

  const fields =
    "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url}";
  const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&limit=50&access_token=${INSTAGRAM_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return;

  const json: IGMediaResponse = await res.json();
  const supabase = await createServerSupabaseClient();

  const posts = json.data.map((post) => ({
    id: post.id,
    media_type: post.media_type,
    media_url: post.media_url,
    thumbnail_url: post.thumbnail_url ?? null,
    permalink: post.permalink,
    caption: post.caption ?? null,
    timestamp: post.timestamp,
    carousel_items:
      post.children?.data.map((c) => ({
        media_url: c.media_url,
        media_type: c.media_type,
      })) ?? null,
    cached_at: new Date().toISOString(),
  }));

  if (posts.length > 0) {
    await supabase.from("instagram_posts").upsert(posts, { onConflict: "id" });
  }
}

export async function getInstagramPosts(limit = 30): Promise<InstagramPost[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  return (data as InstagramPost[]) ?? [];
}
