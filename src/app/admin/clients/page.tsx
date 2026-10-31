import { createAdminSupabaseClient } from "@/lib/supabase/server";
import ClientsListClient from "./ClientsListClient";

export default async function AdminClientsPage() {
  const supabase = await createAdminSupabaseClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  // Surface failures via app/admin/error.tsx instead of an empty list.
  if (error) throw new Error(`Failed to load clients: ${error.message}`);

  return <ClientsListClient clients={clients ?? []} />;
}
