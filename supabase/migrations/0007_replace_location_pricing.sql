-- 0007: atomic location-pricing replace.
--
-- The upload route used to delete a location's prices and then insert the new
-- sheet as two separate API calls. If the insert failed (bad price, a species
-- deleted mid-upload) the old prices were already gone. A function body runs
-- in one transaction, so here either the whole replace happens or none of it.
--
-- Rows with no size are stored as NULL (the template writes "-" for those; the
-- app maps it before calling this).

create or replace function public.replace_location_pricing(
  p_locations text[],
  p_rows jsonb
) returns integer
language plpgsql
as $$
declare
  inserted integer;
begin
  delete from location_pricing where location = any(p_locations);

  insert into location_pricing (species_id, location, size, price)
  select (r->>'species_id')::uuid,
         r->>'location',
         nullif(r->>'size', ''),
         (r->>'price')::numeric
    from jsonb_array_elements(p_rows) as r;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Only the server (service role) may call it.
revoke all on function public.replace_location_pricing(text[], jsonb) from public, anon, authenticated;
grant execute on function public.replace_location_pricing(text[], jsonb) to service_role;

-- Existing "-" placeholder sizes become NULL so "no size" means one thing.
-- Skip any row whose NULL twin already exists to respect the unique key.
update location_pricing lp
   set size = null
 where lp.size = '-'
   and not exists (
     select 1 from location_pricing o
      where o.species_id = lp.species_id
        and o.location = lp.location
        and o.size is null
   );
