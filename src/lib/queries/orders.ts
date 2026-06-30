import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OrderWithGroups,
  OrderInsert,
  OrderGroupInsert,
  OrderItemInsert,
  OrderStatus,
} from "@/types/database";

export async function getOrders(options?: {
  status?: OrderStatus;
  clientId?: string;
  limit?: number;
}): Promise<OrderWithGroups[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      order_groups(
        *,
        order_items(*)
      )
    `,
    )
    .order("submitted_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.clientId) query = query.eq("client_id", options.clientId);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return (data as OrderWithGroups[]) ?? [];
}

export async function getOrderById(
  id: string,
): Promise<OrderWithGroups | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_groups(
        *,
        order_items(*)
      )
    `,
    )
    .eq("id", id)
    .single();
  return data as OrderWithGroups | null;
}

export async function createOrder(
  order: OrderInsert,
  groups: { name: string; items: Omit<OrderItemInsert, "order_group_id">[] }[],
) {
  const supabase = await createServerSupabaseClient();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (orderError || !orderData) throw orderError;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupInsert: OrderGroupInsert = {
      order_id: orderData.id,
      group_name: group.name,
      sort_order: i,
    };

    const { data: groupData, error: groupError } = await supabase
      .from("order_groups")
      .insert(groupInsert)
      .select()
      .single();

    if (groupError || !groupData) throw groupError;

    const itemsToInsert = group.items.map((item) => ({
      ...item,
      order_group_id: groupData.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }

  return orderData;
}

function generateOrderReference(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `INA-${y}${m}${d}-${rand}`;
}

// The public order form relies on the random suffix rarely colliding. Admin
// imports create orders deliberately, so guard against the (small) collision
// chance by checking the unique constraint before insert and regenerating.
async function generateUniqueOrderReference(
  admin: SupabaseClient,
  attempts = 10,
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const ref = generateOrderReference();
    const { data } = await admin
      .from("orders")
      .select("id")
      .eq("order_reference", ref)
      .maybeSingle();
    if (!data) return ref;
  }
  // Extremely unlikely fallback — widen the suffix to make a clash negligible.
  return `${generateOrderReference()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export { generateOrderReference, generateUniqueOrderReference };
