-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create the location_pricing table (was missing from this database).
-- Safe to run multiple times — every statement is idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table -----------------------------------------------------------------------
-- Master pricing per destination region, used to auto-fill client price lists.
create table if not exists location_pricing (
  id uuid primary key default uuid_generate_v4(),
  species_id uuid not null references species(id) on delete cascade,
  location text not null, -- e.g. 'Europe', 'Asia', 'USA'
  size text, -- nullable; if null = applies to all sizes
  price decimal(10,2) not null,
  created_at timestamptz default now(),
  unique(species_id, location, size)
);

create index if not exists idx_location_pricing_location
  on location_pricing(location);

-- Row level security ----------------------------------------------------------
alter table location_pricing enable row level security;

drop policy if exists "Admin all location_pricing" on location_pricing;
create policy "Admin all location_pricing"
  on location_pricing for all using (auth.role() = 'authenticated');

-- Tell PostgREST to refresh its schema cache so the API sees the new table -----
notify pgrst, 'reload schema';
