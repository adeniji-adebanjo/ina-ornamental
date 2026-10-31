import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { syncInstagramPosts } from "@/lib/queries/instagram";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  // Auth — either an authenticated admin session or the cron secret.
  const cronSecret = request.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  // Constant-time compare so the secret can't be recovered byte-by-byte from
  // response timing (lengths must match for timingSafeEqual).
  const isCron =
    expected.length > 0 &&
    cronSecret.length === expected.length &&
    timingSafeEqual(Buffer.from(cronSecret), Buffer.from(expected));

  if (!isCron) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!isAdmin(user)) {
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
