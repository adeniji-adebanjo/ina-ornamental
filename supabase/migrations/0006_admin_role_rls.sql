-- 0006: lock down row-level security.
--
-- 1. Admin = app_metadata.role = 'admin', not "any authenticated user".
--    Previously every signed-in account (including self sign-ups) had full
--    read/write on every table through the public API.
-- Safe to re-run: every step is idempotent.
--
-- 2. Drop the public SELECT on client_price_lists / client_price_items. They
--    exposed every list's access_token and every negotiated price to anyone
--    holding the (public) anon key. The app reads these server-side with the
--    service role, so nothing depends on the policies.
-- 3. Drop the public INSERT on orders / order_groups / order_items. Orders are
--    written by /api/orders with the service role after server-side
--    validation; direct anon inserts bypassed every check.
--
-- The admin accounts are granted the role below, in the same transaction as
-- the policy change, so there's no window where nobody can use /admin.
-- Signed-in admins must sign out and back in (or wait for their token to
-- refresh) for the new claim to appear in their session.
--
-- Also disable public sign-ups: Dashboard → Authentication → Sign In /
-- Providers → "Allow new users to sign up" = off.

-- Admin accounts ------------------------------------------------------------------
-- To add or remove an admin later, run the same kind of update for that email
-- (use `raw_app_meta_data - 'role'` to remove it).
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                           || '{"role":"admin"}'::jsonb
 where lower(email) in (
   'inaornamental@gmail.com',
   'aeben.adebanjo@gmail.com'
 );

-- Fail loudly (rolling back the whole migration) if either account doesn't
-- exist yet, rather than locking everyone out of /admin.
do $$
declare
  granted int;
begin
  select count(*) into granted
    from auth.users
   where lower(email) in ('inaornamental@gmail.com', 'aeben.adebanjo@gmail.com')
     and raw_app_meta_data ->> 'role' = 'admin';
  if granted < 2 then
    raise exception
      'Expected 2 admin accounts, found %. Create the missing Supabase user(s) first, then re-run.',
      granted;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- Policies: reset to an exact, known set ----------------------------------------
-- Permissive policies are OR'd together, so ANY leftover policy (whatever its
-- name — the live database has drifted from schema.sql) could keep a hole
-- open. Drop every policy on these tables, then recreate exactly:
--   • public SELECT on the 5 catalogue tables
--   • admin-only ALL on every table
-- Nothing public on clients, price lists, orders or location pricing.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'categories', 'species', 'species_images', 'clients',
    'client_price_lists', 'client_price_items', 'orders', 'order_groups',
    'order_items', 'instagram_posts', 'site_settings', 'location_pricing'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    for p in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      'Admin all ' || t, t);
  end loop;

  foreach t in array array[
    'categories', 'species', 'species_images', 'instagram_posts', 'site_settings'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (true)',
      'Public read ' || t, t);
  end loop;
end $$;
