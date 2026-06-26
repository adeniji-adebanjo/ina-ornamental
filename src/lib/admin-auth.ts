import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated admin user, or null if the request is not signed
 * in. Admin API routes use this to gate writeback (mirrors the inline check in
 * the species routes, centralised so the blog routes stay terse).
 */
export async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
