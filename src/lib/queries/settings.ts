import {
  createPublicSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export const SETTINGS_TAG = "settings";

async function querySetting(key: string): Promise<string | null> {
  const supabase = await createPublicSupabaseClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();
  if (!data) return null;
  const val = data.value;
  if (val === null || val === "null" || val === "") return null;
  return typeof val === "string" ? val : JSON.stringify(val);
}

// Cached public read — invalidated by revalidateTag("settings") on write, with
// a 60s TTL safety net.
export const getSetting = unstable_cache(querySetting, ["site-setting"], {
  tags: [SETTINGS_TAG],
  revalidate: 60,
});

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("site_settings").select("*");
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}
