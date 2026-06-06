import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { ClientPriceListWithItems } from "@/types/database";

export async function getClientPriceList(
  slug: string,
  token: string,
): Promise<ClientPriceListWithItems | null> {
  const supabase = await createAdminSupabaseClient();

  const { data } = await supabase
    .from("client_price_lists")
    .select(
      `
      *,
      client:clients(*),
      items:client_price_items(
        *,
        species(
          *,
          category:categories(*),
          images:species_images(*)
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("access_token", token)
    .eq("active", true)
    .single();

  if (!data) return null;

  // Check if the price list has expired
  const now = new Date();
  if (data.valid_until && new Date(data.valid_until) < now) return null;

  return data as ClientPriceListWithItems;
}
