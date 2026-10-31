import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * A signed-in Supabase user is NOT automatically an admin: anyone could create
 * an account if sign-ups are ever enabled. Admins carry `role: "admin"` in
 * `app_metadata`, which only the service role can write (users cannot edit it
 * from the browser). Grant it with supabase/migrations/0006_admin_role_rls.sql.
 * The RLS policies check the same claim via public.is_admin().
 */
export function isAdmin(user: User | null | undefined): user is User {
  return user?.app_metadata?.role === "admin";
}

/**
 * Returns the authenticated admin user, or null if the request is not signed
 * in as an admin. Admin API routes use this to gate writeback.
 */
export async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user) ? user : null;
}
