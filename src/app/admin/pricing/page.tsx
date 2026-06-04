import { createAdminSupabaseClient } from "@/lib/supabase/server";
import PricingListClient from "./PricingListClient";

export default async function AdminPricingPage() {
  const supabase = await createAdminSupabaseClient();
  const [{ data: priceLists }, { data: clients }, { data: species }] =
    await Promise.all([
      supabase
        .from("client_price_lists")
        .select(
          "*, client:clients(*), items:client_price_items(*, species:species(common_name, scientific_name))",
        )
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, company").order("name"),
      supabase
        .from("species")
        .select("id, common_name, scientific_name")
        .order("common_name"),
    ]);

  return (
    <PricingListClient
      priceLists={priceLists ?? []}
      clients={clients ?? []}
      species={species ?? []}
    />
  );
}
