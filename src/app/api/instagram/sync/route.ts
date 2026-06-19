import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncInstagramPosts } from "@/lib/queries/instagram";

export async function POST(request: NextRequest) {
  // Auth — either an authenticated admin session or the cron secret.
  const cronSecret = request.headers.get("x-cron-secret");
  const isCron =
    !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

  if (!isCron) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const count = await syncInstagramPosts();
    return NextResponse.json({ success: true, count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
