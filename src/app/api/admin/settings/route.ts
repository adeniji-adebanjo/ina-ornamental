import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { SETTINGS_TAG } from "@/lib/queries/settings";
import { revalidateTag } from "next/cache";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("site_settings").select("*");
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // `site_settings.value` is `jsonb NOT NULL`. Coerce an empty/absent value to
  // an empty string so we never write a SQL NULL (which violates the column).
  const safeValue = value === null || value === undefined ? "" : value;

  const admin = await createAdminSupabaseClient();
  const { error } = await admin
    .from("site_settings")
    .upsert({ key, value: safeValue }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag(SETTINGS_TAG, "max");
  return NextResponse.json({ success: true });
}
