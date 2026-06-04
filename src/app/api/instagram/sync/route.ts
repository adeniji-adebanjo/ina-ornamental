import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || "me";

export async function POST(request: NextRequest) {
  // Auth check — either admin session or cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  const isCron = cronSecret === process.env.CRON_SECRET;

  if (!isCron) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!INSTAGRAM_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "INSTAGRAM_ACCESS_TOKEN not configured" },
      { status: 500 },
    );
  }

  try {
    // Fetch posts from Instagram Graph API
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=50&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const igRes = await fetch(url);

    if (!igRes.ok) {
      const err = await igRes.text();
      return NextResponse.json(
        { error: `Instagram API error: ${err}` },
        { status: 502 },
      );
    }

    const igData = await igRes.json();
    const posts = igData.data || [];

    const supabase = await createServerSupabaseClient();

    // Upsert posts into DB
    const rows = posts.map(
      (p: {
        id: string;
        caption?: string;
        media_type: string;
        media_url: string;
        thumbnail_url?: string;
        permalink: string;
        timestamp: string;
      }) => ({
        instagram_id: p.id,
        caption: p.caption ?? null,
        media_type: p.media_type,
        media_url: p.media_url,
        thumbnail_url: p.thumbnail_url ?? null,
        permalink: p.permalink,
        posted_at: p.timestamp,
      }),
    );

    if (rows.length > 0) {
      const { error } = await supabase
        .from("instagram_posts")
        .upsert(rows, { onConflict: "instagram_id" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ count: rows.length, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
