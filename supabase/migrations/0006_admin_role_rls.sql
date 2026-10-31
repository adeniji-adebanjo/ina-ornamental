-- 0006: lock down row-level security.
--
-- 1. Admin = app_metadata.role = 'admin', not "any authenticated user".
--    Previously every signed-in account (including self sign-ups) had full
--    read/write on every table through the public API.
-- 2. Drop the public SELECT on client_price_lists / client_price_items. They
--    exposed every list's access_token and every negotiated price to anyone
--    holding the (public) anon key. The app reads these server-side with the
--    service role, so nothing depends on the policies.
-- 3. Drop the public INSERT on orders / order_groups / order_items. Orders are
--    written by /api/orders with the service role after server-side
--    validation; direct anon inserts bypassed every check.
--
-- ⚠ BEFORE running this, grant the admin role to the real admin account(s),
--   or nobody will be able to use /admin afterwards:
--
--     update auth.users
--        set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                                || '{"role":"admin"}'::jsonb
--      where email in ('you@example.com');
--
--   Signed-in admins must sign out and back in (or wait for their token to
--   refresh) for the new claim to appear in their session.
--
-- Also disable public sign-ups: Dashboard → Authentication → Sign In /
-- Providers → "Allow new users to sign up" = off.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- Admin policies: replace "authenticated" with is_admin() -----------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'species', 'species_images', 'clients',
    'client_price_lists', 'client_price_items', 'orders', 'order_groups',
    'order_items', 'instagram_posts', 'site_settings', 'location_pricing'
  ]
  loop
    -- schema.sql names the instagram policy "Admin all instagram".
    execute format('drop policy if exists %I on %I',
      'Admin all ' || case when t = 'instagram_posts' then 'instagram' else t end, t);
    execute format(
      'create policy %I on %I for all using (public.is_admin()) with check (public.is_admin())',
      'Admin all ' || t, t);
  end loop;
end $$;

-- Public holes ------------------------------------------------------------------
drop policy if exists "Public read client_price_lists" on client_price_lists;
drop policy if exists "Public read client_price_items" on client_price_items;

drop policy if exists "Public insert orders" on orders;
drop policy if exists "Public insert order_groups" on order_groups;
drop policy if exists "Public insert order_items" on order_items;
