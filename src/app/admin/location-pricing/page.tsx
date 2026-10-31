import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import LocationPricingClient from "./LocationPricingClient";

export default async function LocationPricingPage() {
  const supabase = await createAdminSupabaseClient();
  const { data } = await fetchAllRows((from, to) =>
    supabase
      .from("location_pricing")
      .select("location")
      .order("id")
      .range(from, to),
  );

  // Group by location into { location, count }
  const grouped: Record<string, number> = {};
  for (const row of data ?? []) {
    grouped[row.location] = (grouped[row.location] || 0) + 1;
  }
  const initialLocations = Object.entries(grouped).map(([location, count]) => ({
    location,
    count,
  }));

  return <LocationPricingClient initialLocations={initialLocations} />;
}
