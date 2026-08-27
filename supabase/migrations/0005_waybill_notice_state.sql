-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: remember what shipment details the customer was actually told.
-- Lets rapid waybill edits collapse into a single correction email (a cooldown)
-- without ever dropping one: anything owed is flushed on the next write.
-- Safe to run multiple times — every statement is idempotent.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- The waybill value in the customer's most recent email, and when it was sent.
-- Compared against orders.awb_number to decide whether a correction is owed.
alter table orders add column if not exists awb_notified_value text;
alter table orders add column if not exists awb_notified_at timestamptz;

-- Existing shipments were emailed under the pre-cooldown code, which always
-- sent immediately. Treat the current waybill as already communicated so this
-- migration doesn't trigger a correction to every past customer on next edit.
update orders
   set awb_notified_value = awb_number,
       awb_notified_at = coalesce(updated_at, now())
 where awb_number is not null
   and manual_status is not null
   and awb_notified_value is null;

-- Tell PostgREST to refresh its schema cache so the API sees the new columns --
notify pgrst, 'reload schema';
