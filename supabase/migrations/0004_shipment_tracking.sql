-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: air cargo tracking fields on orders.
-- Lets an admin record the Air Waybill so the client-facing tracking card can
-- deep-link into the airline's own cargo portal (no paid tracking API).
-- Safe to run multiple times — every statement is idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Shipment status ------------------------------------------------------------
-- Manually advanced by the INÁ team; separate from `orders.status`, which
-- tracks the commercial lifecycle (submitted → confirmed → …).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_status') then
    create type shipment_status as enum (
      'BOOKED',
      'DEPARTED',
      'IN_TRANSIT',
      'ARRIVED',
      'DELIVERED'
    );
  end if;
end
$$;

-- Columns ---------------------------------------------------------------------
-- awb_number stores the canonical hyphenated form, e.g. '071-12345678'.
-- carrier_prefix / airline_name are denormalized from the AWB prefix at write
-- time so historical orders keep the carrier they actually flew on even if the
-- prefix table changes later.
alter table orders add column if not exists awb_number text;
alter table orders add column if not exists carrier_prefix text;
alter table orders add column if not exists airline_name text;
alter table orders add column if not exists manual_status shipment_status;

-- An AWB is 3-digit airline prefix + 8-digit serial, stored hyphenated.
alter table orders drop constraint if exists orders_awb_number_format;
alter table orders add constraint orders_awb_number_format
  check (awb_number is null or awb_number ~ '^\d{3}-\d{8}$');

alter table orders drop constraint if exists orders_carrier_prefix_format;
alter table orders add constraint orders_carrier_prefix_format
  check (carrier_prefix is null or carrier_prefix ~ '^\d{3}$');

-- Clients look their shipment up by AWB, so index it (nulls excluded).
create index if not exists idx_orders_awb_number
  on orders(awb_number) where awb_number is not null;

-- Tell PostgREST to refresh its schema cache so the API sees the new columns --
notify pgrst, 'reload schema';
