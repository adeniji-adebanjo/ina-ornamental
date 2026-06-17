-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create the site_settings table (was missing from this database).
-- Safe to run multiple times — every statement is idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table -----------------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Default row: featured category = JSON null (show species flagged "featured")
insert into site_settings (key, value)
values ('featured_category_id', 'null'::jsonb)
on conflict (key) do nothing;

-- Row level security ----------------------------------------------------------
alter table site_settings enable row level security;

drop policy if exists "Public read site_settings" on site_settings;
create policy "Public read site_settings"
  on site_settings for select using (true);

drop policy if exists "Admin all site_settings" on site_settings;
create policy "Admin all site_settings"
  on site_settings for all using (auth.role() = 'authenticated');

-- updated_at trigger ----------------------------------------------------------
-- (function already exists if the rest of the schema was applied; create to be safe)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_site_settings_updated on site_settings;
create trigger trg_site_settings_updated
  before update on site_settings
  for each row execute function update_updated_at();

-- Tell PostgREST to refresh its schema cache so the API sees the new table -----
notify pgrst, 'reload schema';
