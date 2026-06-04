import { createAdminSupabaseClient } from "@/lib/supabase/server";
import ClientsListClient from "./ClientsListClient";

export default async function AdminClientsPage() {
  const supabase = await createAdminSupabaseClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return <ClientsListClient clients={clients ?? []} />;
}
