# inaornamentalfish.com — Deployment Runbook

Architecture: **Next.js owns the apex**; WordPress is retained only for
`/wp-admin`, `/wp-login.php`, `/wp-json`, `/wp-cron.php`, and the media at
`/wp-content/uploads/`. Nginx terminates TLS and routes by path. No subdomain.

> Because `/wp-content/uploads` stays on the apex, **existing
> `species_images.image_url` values keep resolving with no DB change.**

Files in this folder:
- `nginx/inaornamentalfish.com.conf` → `/etc/nginx/sites-available/`
- `nginx/snippets/ina-security.conf` → `/etc/nginx/snippets/`
- `wp-config-snippet.php` → merge into `/var/www/wordpress/wp-config.php`
- `systemd/inaornamentalfish-next.service` → `/etc/systemd/system/`

---

## 0. Prerequisites (one-time, on the Ubuntu 22.04 server)

```bash
sudo apt update
sudo apt install -y nginx php8.2-fpm certbot python3-certbot-nginx
# Node 20 LTS (for Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo systemctl enable --now nginx php8.2-fpm
sudo ufw allow 'Nginx Full'   # opens 80 + 443
sudo ufw allow OpenSSH
```

Confirm the PHP-FPM socket path matches the Nginx config:
```bash
ls /run/php/php8.2-fpm.sock     # must exist
```

---

## 1. DNS (at your registrar / DNS host)

Point web traffic at the server; **leave mail records alone**.

| Type | Name | Value | Note |
|------|------|-------|------|
| A | `@` (apex) | `<SERVER_IPV4>` | the Ubuntu server |
| AAAA | `@` | `<SERVER_IPV6>` | only if server has IPv6 |
| A | `www` | `<SERVER_IPV4>` | redirected to apex by Nginx |
| MX / TXT(SPF) / DKIM | — | **unchanged** | do **not** edit — breaks `alfred@` email |

- Lower TTL to 300s a day before cutover for a fast rollback.
- Verify propagation: `dig +short inaornamentalfish.com A` and `dig www...`.

---

## 2. Deploy the Next.js app

```bash
sudo mkdir -p /var/www/ina-app
sudo chown -R www-data:www-data /var/www/ina-app
# Pull the repo into /var/www/ina-app (git clone / rsync / CI artifact), then:
cd /var/www/ina-app
sudo -u www-data npm ci
sudo -u www-data npm run build
# Production env (Supabase keys, SMTP, etc.). Must include:
#   NEXT_PUBLIC_SITE_URL=https://inaornamentalfish.com
sudo -u www-data cp .env.example .env.production && sudo -u www-data nano .env.production
```

Install and start the service:
```bash
sudo cp deploy/systemd/inaornamentalfish-next.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now inaornamentalfish-next
curl -I http://127.0.0.1:3000      # expect 200/redirect from Next
```

---

## 3. WordPress config

```bash
sudo -u www-data nano /var/www/wordpress/wp-config.php   # paste wp-config-snippet.php contents
sudo chown -R www-data:www-data /var/www/wordpress
```

Replace WordPress pseudo-cron (frontend no longer triggers it):
```bash
echo '*/15 * * * * www-data curl -s https://inaornamentalfish.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1' \
  | sudo tee /etc/cron.d/wp-cron
```

---

## 4. Nginx + TLS (certbot)

```bash
# Security + proxy snippets, image cache dir, site config
sudo cp deploy/nginx/snippets/ina-security.conf /etc/nginx/snippets/
sudo cp deploy/nginx/snippets/ina-next-proxy.conf /etc/nginx/snippets/
sudo cp deploy/nginx/snippets/ina-csp.conf /etc/nginx/snippets/
sudo mkdir -p /var/cache/nginx/ina_img && sudo chown www-data: /var/cache/nginx/ina_img
sudo cp deploy/nginx/inaornamentalfish.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/inaornamentalfish.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Webroot for the ACME challenge
sudo mkdir -p /var/www/certbot
```

The :443 blocks reference certs that don't exist yet, so bring HTTPS up in two steps:

```bash
# (a) Temporarily comment out BOTH `server { listen 443 ... }` blocks, keep :80.
sudo nginx -t && sudo systemctl reload nginx

# (b) Issue the cert (SAN covers apex + www)
sudo certbot certonly --webroot -w /var/www/certbot \
  -d inaornamentalfish.com -d www.inaornamentalfish.com \
  --agree-tos -m alfred@inaornamentalfish.com --no-eff-email

# (c) Uncomment the :443 blocks, then:
sudo nginx -t && sudo systemctl reload nginx
```

Auto-renew is already scheduled by the `certbot.timer`. Make renewals reload Nginx:
```bash
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
```

---

## 5. Smoke tests

```bash
# App at apex, www redirect, HSTS + security headers present
curl -I https://inaornamentalfish.com/                 # 200, from Next.js
curl -I https://www.inaornamentalfish.com/             # 301 -> https://inaornamentalfish.com
curl -sI https://inaornamentalfish.com/ | grep -i strict-transport-security

# WordPress kept paths
curl -I https://inaornamentalfish.com/wp-login.php     # 200 (WP login)
curl -I https://inaornamentalfish.com/wp-json/         # 200 JSON (REST)
# Media served by Nginx with 1y immutable cache
curl -sI https://inaornamentalfish.com/wp-content/uploads/2024/04/<any-image>.jpg \
  | grep -i cache-control                              # public, max-age=31536000, immutable

# Old WP front controller must NOT serve the old homepage:
curl -I https://inaornamentalfish.com/index.php        # handled by Next.js, not WP

# PHP must not execute from uploads (should be 403):
curl -I https://inaornamentalfish.com/wp-content/uploads/evil.php
```

Then in a browser: log into `/wp-admin`, upload a test image, confirm it appears
in the Next.js app; place a test order to confirm SMTP email still sends; confirm
`alfred@` mail still arrives (validates MX was untouched).

---

## 6. Rollback

- **Fast:** repoint apex/`www` A records back to the old WordPress host (low TTL
  from step 1 makes this quick).
- **App only:** `sudo systemctl stop inaornamentalfish-next` and temporarily set
  `location / { ... }` to serve WordPress (`try_files $uri $uri/ @wp_index;`),
  reload Nginx.

---

## 7. Release checklist: security & performance update (Nov 2026)

Do these in order. Steps 1–2 happen in the Supabase dashboard **before** the
new code goes live, or admins get locked out.

1. **Disable public sign-ups:** Authentication → Sign In / Providers →
   "Allow new users to sign up" = off.
2. **Check the user list** (`select email, created_at from auth.users order by created_at;`)
   and delete any account you don't recognise. Both admin accounts
   (`inaornamental@gmail.com`, `aeben.adebanjo@gmail.com`) must already exist.
3. **Run migrations** `supabase/migrations/0006_admin_role_rls.sql` then
   `0007_replace_location_pricing.sql` (SQL editor, or `supabase db push`).
   0006 grants the admin role to the two accounts above and aborts (changing
   nothing) if either is missing.
4. **Env:** add `NEXT_PUBLIC_GA_ID=G-…` to `.env.production` (analytics no
   longer has a hard-coded fallback and stays off without it). Optionally
   `CRON_SECRET` for the Instagram sync.
5. **Deploy the app** (`npm ci && npm run build`, restart the service).
6. **Nginx:** copy the updated site conf + both snippets, create the image
   cache dir (section 4), `sudo nginx -t && sudo systemctl reload nginx`.
7. **Admins sign out and back in** so their session carries the new role.

Smoke tests after the release:
```bash
# Throttling: the 7th rapid order POST in a minute should get 429 from Nginx
for i in $(seq 1 8); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://inaornamentalfish.com/api/orders -H 'content-type: application/json' -d '{}'; done
# Image cache: second request should say HIT
curl -sI "https://inaornamentalfish.com/_next/image?url=%2Fimages%2Ffish-placeholder.svg&w=640&q=75" | grep -i x-cache-status
```
Then, logged out in a private window, place a small order through a client
price-list link, and confirm the emails arrive.

---

## 8. CI/CD (GitHub Actions)

- **`.github/workflows/ci.yml`** runs on every push and pull request: lint,
  type-check, unit tests, a dependency audit and a production build.
- **`.github/workflows/deploy.yml`** runs after CI passes on `main`, or manually
  from Actions → Deploy → Run workflow. It **builds on GitHub's machines**, so the
  CPU-heavy `next build` never runs on the server. It then uploads the build and
  runs `deploy/remote-deploy.sh`, which:
  1. unpacks the build into its own release folder;
  2. installs runtime packages only;
  3. switches the live link over to the new release;
  4. restarts the service and health-checks it;
  5. **rolls back automatically** if the health check fails.
- **Database migrations are never run automatically.** Apply them deliberately
  (section 7) *before* deploying code that depends on them.

### One-time server setup

The existing systemd unit and Nginx config keep working unchanged:
`/var/www/ina-app` becomes a link to the current release.

```bash
# 1. A deploy user that can only restart the app service
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG www-data deploy
echo 'deploy ALL=(root) NOPASSWD: /bin/systemctl restart inaornamentalfish-next' \
  | sudo tee /etc/sudoers.d/ina-deploy && sudo chmod 440 /etc/sudoers.d/ina-deploy

# 2. Release layout; move the existing secrets into the shared folder
sudo mkdir -p /var/www/ina/releases /var/www/ina/shared
sudo cp /var/www/ina-app/.env.production /var/www/ina/shared/.env.production
sudo chown -R deploy:www-data /var/www/ina && sudo chmod 640 /var/www/ina/shared/.env.production

# 3. Turn the current install into the first "release" and link it
sudo mv /var/www/ina-app /var/www/ina/releases/initial
sudo ln -sfn /var/www/ina/releases/initial /var/www/ina-app
sudo chown -h deploy:www-data /var/www/ina-app
sudo chown deploy:www-data /var/www   # deploy must be able to swap the link

# 4. SSH key for GitHub Actions (on your own machine)
ssh-keygen -t ed25519 -f ina-deploy -N "" -C "github-actions-deploy"
# append ina-deploy.pub to /home/deploy/.ssh/authorized_keys on the server
ssh-keyscan -t ed25519 inaornamentalfish.com   # → DEPLOY_KNOWN_HOSTS
```

If giving the deploy user `/var/www` feels too broad, move the link to a folder
it owns (for example `/var/www/ina/current`). Then point the systemd
`WorkingDirectory`/`EnvironmentFile` and the Nginx `/_next/static/` alias at
that folder, and set `CURRENT` in `remote-deploy.sh` to match.

### GitHub secrets

Set these in Settings → Environments → **production** (deploy) and, for CI's
build check, also as repository secrets:

| Secret | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Same as `.env.production` |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | Same as `.env.production` (deploy only) |
| `DEPLOY_HOST` | `inaornamentalfish.com` (or the server IP) |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Contents of the private key `ina-deploy` |
| `DEPLOY_KNOWN_HOSTS` | Output of the `ssh-keyscan` line above |

`NEXT_PUBLIC_*` values are compiled into the browser bundle at build time. If
you change one, update the GitHub secret and redeploy; editing
`.env.production` alone has no effect on them. Server-only values such as SMTP
and WordPress are read from `.env.production` at runtime.

Optional: add yourself as a **required reviewer** on the production
environment so each deploy waits for one click of approval.

**Manual rollback** (picks the previous release):
```bash
ls -1dt /var/www/ina/releases/*/        # newest first
sudo -u deploy ln -sfn /var/www/ina/releases/<previous> /var/www/ina-app
sudo systemctl restart inaornamentalfish-next
```

---

## Notes
- Next.js binds to `127.0.0.1:3000` only; Nginx is the sole public listener.
- Rate limiting is two-layer: Nginx `limit_req` per IP (cheap, before Node),
  then the app's per-endpoint limits in `src/lib/rate-limit.ts`. The app's
  limiter is in-process memory, which is correct for this single-process
  deployment; run more than one instance and it must move to Redis.
- `next.config.ts` (this repo uses TS, not `.js`) already whitelists
  `inaornamentalfish.com/wp-content/uploads/**` for `next/image`.
- The `map $http_upgrade $connection_upgrade` block lives at the bottom of the
  site config (http scope). If another enabled site already defines it, move it
  to `/etc/nginx/conf.d/websocket.conf` to avoid a duplicate-definition error.
