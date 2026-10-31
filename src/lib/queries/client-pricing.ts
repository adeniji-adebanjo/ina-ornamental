import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { ClientPriceListWithItems } from "@/types/database";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a price list can be used right now. Admins pick bare dates, which
 * Postgres stores as midnight UTC; a "valid until 31 Oct" list must keep
 * working for the whole of 31 Oct, so a midnight-UTC end date is treated as
 * inclusive (expires at the following midnight).
 */
export function isPriceListLive(
  pl: { active: boolean; valid_from: string | null; valid_until: string | null },
  now: Date = new Date(),
): boolean {
  if (!pl.active) return false;
  if (pl.valid_from && new Date(pl.valid_from).getTime() > now.getTime())
    return false;
  if (pl.valid_until) {
    const until = new Date(pl.valid_until);
    const isBareDate =
      until.getUTCHours() === 0 &&
      until.getUTCMinutes() === 0 &&
      until.getUTCSeconds() === 0 &&
      until.getUTCMilliseconds() === 0;
    const end = until.getTime() + (isBareDate ? DAY_MS : 0);
    if (now.getTime() >= end) return false;
  }
  return true;
}

export async function getClientPriceList(
  slug: string,
  token: string,
): Promise<ClientPriceListWithItems | null> {
  const supabase = await createAdminSupabaseClient();

  const { data, error } = await supabase
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
    .maybeSingle();

  if (error) throw new Error(`Failed to load price list: ${error.message}`);
  if (!data || !isPriceListLive(data)) return null;

  return data as ClientPriceListWithItems;
}

export interface OrderablePriceItem {
  species_id: string;
  unit_price: number;
  species_name: string;
  scientific_name: string | null;
  sizes: string[];
  qty_per_box: number;
  availability: string | null;
}

/**
 * The server-side view of a price list used when an order is submitted: the
 * list's own id/client and the authoritative price per species. Order
 * submissions are priced from this, never from what the browser sends.
 */
export async function getOrderablePriceList(
  slug: string,
  token: string,
): Promise<{
  id: string;
  client_id: string | null;
  items: Map<string, OrderablePriceItem>;
} | null> {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("client_price_lists")
    .select(
      `id, client_id, active, valid_from, valid_until,
       items:client_price_items(
         species_id, custom_price,
         species(common_name, scientific_name, sizes, qty_per_box, availability)
       )`,
    )
    .eq("slug", slug)
    .eq("access_token", token)
    .maybeSingle();

  if (error) throw new Error(`Failed to load price list: ${error.message}`);
  if (!data || !isPriceListLive(data)) return null;

  const items = new Map<string, OrderablePriceItem>();
  for (const row of data.items ?? []) {
    // Supabase types a to-one embed as an object or array depending on version.
    const sp = Array.isArray(row.species) ? row.species[0] : row.species;
    if (!sp) continue;
    items.set(row.species_id, {
      species_id: row.species_id,
      // Postgres decimals arrive as strings.
      unit_price: Number(row.custom_price),
      species_name: sp.common_name,
      scientific_name: sp.scientific_name ?? null,
      sizes: sp.sizes ?? [],
      qty_per_box: sp.qty_per_box ?? 1,
      availability: sp.availability ?? null,
    });
  }
  return { id: data.id, client_id: data.client_id, items };
}
