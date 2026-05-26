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
}

export interface CartItem {
  product: FishProduct;
  selectedSize: string;
  quantity: number;
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

export type CategoryFilter =
  | "All Species"
  | "Monster Fish"
  | "Tetras"
  | "Polypterus"
  | "Puffers"
  | "Cichlids"
  | "Crabs"
  | "Catfish"
  | "Killifish"
  | "Lungfish"
  | "Oddballs";

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
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}
