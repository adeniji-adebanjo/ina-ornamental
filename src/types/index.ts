export interface FishProduct {
  id: number;
  slug: string;
  commonName: string;
  scientificName: string;
  category: string;
  classOrder: string;
  description: string;
  imageUrl: string;
  sizes: string[];
  tags: string[];
  inStock: boolean;
  featured: boolean;
  availability:
    | "available"
    | "limited_stock"
    | "out_of_stock"
    | "seasonal"
    | "on_request";
  qtyPerBox: number;
}

export interface CartItem {
  product: FishProduct;
  selectedSize: string;
  quantity: number;
  group: string;
}

export interface QuoteRequest {
  items: CartItem[];
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  message: string;
}

export type CategoryFilter = string;

// ─── Blog ──────────────────────────────────────────────────────────────────

export type BlogStatus = "publish" | "draft";

/** Internal, app-facing shape used by both the public site and the admin UI. */
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  /** Full HTML body (as stored by WordPress). */
  content: string;
  /** Short HTML/plain excerpt used in cards and meta descriptions. */
  excerpt: string;
  status: BlogStatus;
  /** ISO date strings. */
  date: string;
  modified: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  categories: BlogCategory[];
  authorName: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/** Payload sent from the admin editor to the writeback API. */
export interface BlogPostInput {
  title: string;
  content: string;
  excerpt?: string;
  status: BlogStatus;
  slug?: string;
  categories?: number[];
  /** WordPress media id of the featured image. */
  featured_media?: number;
}

/** Raw WordPress REST shapes (subset of fields we consume). */
export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPPost {
  id: number;
  slug: string;
  status: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  categories: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text?: string;
    }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string }>>;
    author?: Array<{ name: string }>;
  };
}

export interface WPProduct {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  acf?: {
    scientific_name?: string;
    category?: string;
    class_order?: string;
    sizes?: string;
    tags?: string;
    in_stock?: boolean;
    featured?: boolean;
    qty_per_box?: number;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}
