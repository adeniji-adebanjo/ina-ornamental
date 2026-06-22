-- ─────────────────────────────────────────────────────────────────────────────
-- CUTOVER SCRIPT — repoint species image URLs off the apex domain.
--
-- Context: image files are NOT stored by the app; species_images.image_url just
-- holds URL strings that currently point at the WordPress site on the apex
-- (inaornamentalfish.com) and/or Jetpack's CDN (i0.wp.com). When the apex starts
-- serving the Next.js app, those URLs would 404. This rewrites them to the
-- subdomain where WordPress / the image files will live after cutover.
--
-- BEFORE RUNNING:
--   1. Replace EVERY occurrence of  cms.inaornamentalfish.com  below with the
--      subdomain you will serve the image files from (e.g. media. or cms.).
--   2. Confirm that subdomain already serves the images, e.g. open
--      https://cms.inaornamentalfish.com/wp-content/uploads/... in a browser.
--   3. Run section (1) first (read-only) to preview the impact.
-- Run in: Supabase Dashboard → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- (0) SAFETY BACKUP — snapshot current values so you can roll back -------------
create table if not exists species_images_url_backup as
  select id, image_url, now() as backed_up_at from species_images;

-- (1) PREVIEW — how many rows are affected and what they look like -------------
select
  count(*) filter (where image_url ~* '^https?://(www\.)?inaornamentalfish\.com/') as apex_urls,
  count(*) filter (where image_url ~* '^https?://i[0-2]\.wp\.com/(www\.)?inaornamentalfish\.com/') as jetpack_urls,
  count(*) as total_rows
from species_images;

-- Inspect a sample before/after (does not modify anything):
-- select image_url,
--   regexp_replace(image_url, '^https?://(www\.)?inaornamentalfish\.com/',
--                  'https://cms.inaornamentalfish.com/') as apex_rewrite,
--   regexp_replace(image_url, '^https?://i[0-2]\.wp\.com/(www\.)?inaornamentalfish\.com/',
--                  'https://cms.inaornamentalfish.com/') as jetpack_rewrite
-- from species_images
-- where image_url ilike '%inaornamentalfish.com%' or image_url ilike '%i0.wp.com%'
-- limit 50;

-- (2) REWRITE direct apex URLs → subdomain ------------------------------------
update species_images
set image_url = regexp_replace(
  image_url,
  '^https?://(www\.)?inaornamentalfish\.com/',
  'https://cms.inaornamentalfish.com/'
)
where image_url ~* '^https?://(www\.)?inaornamentalfish\.com/';

-- (3) REWRITE Jetpack CDN URLs (i0/i1/i2.wp.com/<apex>/...) → subdomain --------
--     Drops the Jetpack proxy and serves the image straight from the subdomain.
--     Trailing ?resize=/?w= params are harmless (ignored by a plain web server).
update species_images
set image_url = regexp_replace(
  image_url,
  '^https?://i[0-2]\.wp\.com/(www\.)?inaornamentalfish\.com/',
  'https://cms.inaornamentalfish.com/'
)
where image_url ~* '^https?://i[0-2]\.wp\.com/(www\.)?inaornamentalfish\.com/';

-- (4) VERIFY — should return 0 rows once cutover URLs are in place -------------
select count(*) as still_on_apex_or_jetpack
from species_images
where image_url ~* '^https?://(www\.)?inaornamentalfish\.com/'
   or image_url ~* '^https?://i[0-2]\.wp\.com/(www\.)?inaornamentalfish\.com/';

-- ── ROLLBACK (if needed) ──────────────────────────────────────────────────────
-- update species_images si set image_url = b.image_url
--   from species_images_url_backup b where b.id = si.id;
