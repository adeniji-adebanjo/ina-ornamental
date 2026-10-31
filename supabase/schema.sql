-- ============================================================================
-- INA Ornamental Fish - Supabase Database Schema
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── CATEGORIES ─────────────────────────────────────────────────────────────
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── SPECIES ────────────────────────────────────────────────────────────────
create type availability_status as enum (
  'available', 'limited_stock', 'out_of_stock', 'seasonal', 'on_request'
);

create table species (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  common_name text not null,
  scientific_name text,
  category_id uuid references categories(id) on delete set null,
  class_order text,
  description text,
  origin text default 'West Africa',
  sizes text[], -- e.g. {'Small','Medium','Large'}
  tags text[], -- e.g. {'Monster Fish','Aggressive'}
  qty_per_box int default 1,
  availability availability_status default 'available',
  featured boolean default false,
  best_seller boolean default false,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── SPECIES IMAGES ─────────────────────────────────────────────────────────
create table species_images (
  id uuid primary key default uuid_generate_v4(),
  species_id uuid not null references species(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index idx_species_images_species on species_images(species_id);

-- ─── CLIENTS ────────────────────────────────────────────────────────────────
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text,
  phone text,
  country text,
  address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── CLIENT PRICING PAGES ───────────────────────────────────────────────────
create table client_price_lists (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  slug text not null unique, -- URL path e.g. 'client-abc-2026'
  title text not null,
  access_token text not null default encode(gen_random_bytes(16), 'hex'),
  password_hash text, -- optional bcrypt hash
  valid_from timestamptz default now(),
  valid_until timestamptz,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table client_price_items (
  id uuid primary key default uuid_generate_v4(),
  price_list_id uuid not null references client_price_lists(id) on delete cascade,
  species_id uuid not null references species(id) on delete cascade,
  custom_price decimal(10,2) not null,
  sort_order int default 0,
  unique(price_list_id, species_id)
);

-- ─── ORDERS ─────────────────────────────────────────────────────────────────
create type order_status as enum (
  'draft', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);

-- Physical progress of the air freight, advanced manually by the INÁ team.
create type shipment_status as enum (
  'BOOKED', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_reference text not null unique,
  client_id uuid references clients(id) on delete set null,
  price_list_id uuid references client_price_lists(id) on delete set null,
  -- Customer info (denormalized for order record)
  customer_name text not null,
  company_name text,
  email text not null,
  phone text,
  country text,
  delivery_address text,
  notes text,
  status order_status default 'submitted',
  -- Air cargo tracking (see migration 0004)
  awb_number text check (awb_number is null or awb_number ~ '^\d{3}-\d{8}$'),
  carrier_prefix text check (carrier_prefix is null or carrier_prefix ~ '^\d{3}$'),
  airline_name text,
  manual_status shipment_status,
  -- What the customer's last shipment email said (see migration 0005)
  awb_notified_value text,
  awb_notified_at timestamptz,
  submitted_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_awb_number on orders(awb_number) where awb_number is not null;

create table order_groups (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  group_name text not null default 'Order A',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_group_id uuid not null references order_groups(id) on delete cascade,
  species_id uuid not null references species(id) on delete restrict,
  -- Denormalized for order record
  species_name text not null,
  scientific_name text,
  size text,
  quantity int not null default 1,
  unit_price decimal(10,2),
  created_at timestamptz default now()
);

-- ─── SITE SETTINGS ──────────────────────────────────────────────────────────
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Default: featured_category = null (show all featured species)
insert into site_settings (key, value) values
  ('featured_category_id', 'null'::jsonb);

-- ─── LOCATION PRICING (MASTER SHEET) ───────────────────────────────────────
create table location_pricing (
  id uuid primary key default uuid_generate_v4(),
  species_id uuid not null references species(id) on delete cascade,
  location text not null, -- e.g. 'Europe', 'Asia', 'USA'
  size text, -- nullable; if null = applies to all sizes
  price decimal(10,2) not null,
  created_at timestamptz default now(),
  unique(species_id, location, size)
);

create index idx_location_pricing_location on location_pricing(location);

-- ─── INSTAGRAM CACHE ────────────────────────────────────────────────────────
create table instagram_posts (
  id text primary key, -- Instagram media ID
  media_type text not null, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url text not null,
  thumbnail_url text,
  permalink text,
  caption text,
  timestamp timestamptz,
  carousel_items jsonb, -- array of {media_url, media_type} for carousels
  cached_at timestamptz default now()
);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_categories_updated before update on categories for each row execute function update_updated_at();
create trigger trg_species_updated before update on species for each row execute function update_updated_at();
create trigger trg_clients_updated before update on clients for each row execute function update_updated_at();
create trigger trg_client_price_lists_updated before update on client_price_lists for each row execute function update_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function update_updated_at();
create trigger trg_site_settings_updated before update on site_settings for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
alter table categories enable row level security;
alter table species enable row level security;
alter table species_images enable row level security;
alter table clients enable row level security;
alter table client_price_lists enable row level security;
alter table client_price_items enable row level security;
alter table orders enable row level security;
alter table order_groups enable row level security;
alter table order_items enable row level security;
alter table instagram_posts enable row level security;
alter table site_settings enable row level security;
alter table location_pricing enable row level security;

-- Public read access for catalogue
create policy "Public read categories" on categories for select using (true);
create policy "Public read species" on species for select using (true);
create policy "Public read species_images" on species_images for select using (true);
create policy "Public read instagram" on instagram_posts for select using (true);
create policy "Public read site_settings" on site_settings for select using (true);

-- Admin full access: only accounts with app_metadata.role = 'admin' (see
-- migrations/0006_admin_role_rls.sql). Orders and client price lists have no
-- public policies: the app reads/writes them server-side with the service role.
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

create policy "Admin all categories" on categories for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all species" on species for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all species_images" on species_images for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all clients" on clients for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all client_price_lists" on client_price_lists for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all client_price_items" on client_price_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all orders" on orders for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all order_groups" on order_groups for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all order_items" on order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all instagram_posts" on instagram_posts for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all site_settings" on site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin all location_pricing" on location_pricing for all using (public.is_admin()) with check (public.is_admin());
