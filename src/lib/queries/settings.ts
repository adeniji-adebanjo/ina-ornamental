import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
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

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("site_settings").select("*");
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}
