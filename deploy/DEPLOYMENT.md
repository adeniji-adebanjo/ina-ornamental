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
# Security snippet + site config
sudo cp deploy/nginx/snippets/ina-security.conf /etc/nginx/snippets/
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

## Notes
- Next.js binds to `127.0.0.1:3000` only; Nginx is the sole public listener.
- `next.config.ts` (this repo uses TS, not `.js`) already whitelists
  `inaornamentalfish.com/wp-content/uploads/**` for `next/image`.
- The `map $http_upgrade $connection_upgrade` block lives at the bottom of the
  site config (http scope). If another enabled site already defines it, move it
  to `/etc/nginx/conf.d/websocket.conf` to avoid a duplicate-definition error.
