import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import PricingListClient from "./PricingListClient";

export default async function AdminPricingPage() {
  const supabase = await createAdminSupabaseClient();
  const [
    { data: priceLists, error: priceListsError },
    { data: clients, error: clientsError },
    { data: species, error: speciesError },
    { data: locationPricingRaw, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("client_price_lists")
      .select(
        "*, client:clients(*), items:client_price_items(*, species:species(common_name, scientific_name, availability))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name, company").order("name"),
    fetchAllRows((from, to) =>
      supabase
        .from("species")
        .select("id, common_name, scientific_name, availability")
        .order("common_name")
        .order("id")
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("location_pricing")
        .select("location")
        .order("id")
        .range(from, to),
    ),
  ]);

  // Surface failures via app/admin/error.tsx instead of rendering empty lists.
  const error =
    priceListsError ?? clientsError ?? speciesError ?? locationsError;
  if (error) throw new Error(`Failed to load pricing data: ${error.message}`);

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
