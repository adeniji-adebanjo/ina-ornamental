// ============================================================================
// Supabase Database Types
// ============================================================================

export type AvailabilityStatus =
  | "available"
  | "limited_stock"
  | "out_of_stock"
  | "seasonal"
  | "on_request";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

// ─── Database Row Types ─────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Species {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category_id: string | null;
  class_order: string | null;
  description: string | null;
  origin: string;
  sizes: string[];
  tags: string[];
  qty_per_box: number;
  availability: AvailabilityStatus;
  featured: boolean;
  best_seller: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SpeciesImage {
  id: string;
  species_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientPriceList {
  id: string;
  client_id: string | null;
  slug: string;
  title: string;
  access_token: string;
  password_hash: string | null;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPriceItem {
  id: string;
  price_list_id: string;
  species_id: string;
  custom_price: number;
  sort_order: number;
}

export interface Order {
  id: string;
  order_reference: string;
  client_id: string | null;
  price_list_id: string | null;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: OrderStatus;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrderGroup {
  id: string;
  order_id: string;
  group_name: string;
  sort_order: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_group_id: string;
  species_id: string;
  species_name: string;
  scientific_name: string | null;
  size: string | null;
  quantity: number;
  unit_price: number | null;
  created_at: string;
}

export interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url: string | null;
  permalink: string | null;
  caption: string | null;
  timestamp: string | null;
  carousel_items: Array<{ media_url: string; media_type: string }> | null;
  cached_at: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface LocationPricing {
  id: string;
  species_id: string;
  location: string;
  size: string | null;
  price: number;
  created_at: string;
}

export interface LocationPricingWithSpecies extends LocationPricing {
  species: Species;
}

// ─── Joined / Extended Types ────────────────────────────────────────────────

export interface SpeciesWithImages extends Species {
  images: SpeciesImage[];
  category: Category | null;
}

export interface SpeciesWithCategory extends Species {
  category: Category | null;
}

export interface OrderWithGroups extends Order {
  order_groups: (OrderGroup & { order_items: OrderItem[] })[];
}

export interface ClientPriceListWithItems extends ClientPriceList {
  client: Client | null;
  items: (ClientPriceItem & { species: SpeciesWithImages })[];
}

// ─── Insert Types ───────────────────────────────────────────────────────────

export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at">;
export type SpeciesInsert = Omit<Species, "id" | "created_at" | "updated_at">;
export type SpeciesImageInsert = Omit<SpeciesImage, "id" | "created_at">;
export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at">;
export type OrderGroupInsert = Omit<OrderGroup, "id" | "created_at">;
export type OrderItemInsert = Omit<OrderItem, "id" | "created_at">;
