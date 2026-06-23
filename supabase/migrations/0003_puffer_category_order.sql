-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: move the "Puffers" category to the top of the category order.
-- Categories are listed by `sort_order` ascending (see getCategories), so we set
-- Puffers below the current minimum of every OTHER category.
-- Idempotent — Puffers is excluded from the subquery, so re-running is a no-op.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ─────────────────────────────────────────────────────────────────────────────

update categories
set sort_order = (
  select coalesce(min(sort_order), 0) - 1
  from categories other
  where other.slug <> 'puffers'
)
where slug = 'puffers';

-- Refresh PostgREST's cache so the API reflects the new ordering immediately.
notify pgrst, 'reload schema';
