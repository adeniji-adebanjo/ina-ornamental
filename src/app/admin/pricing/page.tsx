import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import PricingListClient from "./PricingListClient";

export default async function AdminPricingPage() {
  const supabase = await createAdminSupabaseClient();
  const [
    { data: priceLists },
    { data: clients },
    { data: species },
    { data: locationPricingRaw },
  ] = await Promise.all([
    supabase
      .from("client_price_lists")
      .select(
        "*, client:clients(*), items:client_price_items(*, species:species(common_name, scientific_name, availability))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name, company").order("name"),
    supabase
      .from("species")
      .select("id, common_name, scientific_name, availability")
      .order("common_name"),
    fetchAllRows((from, to) =>
      supabase
        .from("location_pricing")
        .select("location")
        .order("id")
        .range(from, to),
    ),
  ]);

  // Get unique locations
  const locations = [
    ...new Set((locationPricingRaw ?? []).map((r) => r.location)),
  ].sort();

  return (
    <PricingListClient
      priceLists={priceLists ?? []}
      clients={clients ?? []}
      species={species ?? []}
      locations={locations}
    />
  );
}
