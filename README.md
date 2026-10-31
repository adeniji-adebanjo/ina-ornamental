# INÁ Ornamental Fish

A full-stack web application for INÁ Ornamental Fish — an ornamental fish export company. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Public Catalogue** — Browse species with filtering, search, and detailed modals
- **Online Ordering** — Multi-group quote/order form with species selection and quantity management
- **Client Price Lists** — Private, token-gated links with custom pricing per client, with start/end dates
- **Location Pricing** — Upload a master price sheet per destination region and auto-fill client price lists from it
- **Air Cargo Tracking** — Deep-links each shipment's Air Waybill into the airline's own cargo portal (no paid tracking API)
- **Admin Dashboard** — Manage species, clients, orders, pricing, blog, and gallery; Excel/CSV import and export
- **Email Notifications** — Order receipts (with an Excel performa invoice) and status/shipment updates
- **Authentication** — Supabase Auth; only accounts with the `admin` role can use the admin area (see [Security](#security))

## App Flow

1. Public user flow:
   - Visit the homepage and explore featured species.
   - Open the catalogue to search, filter, and view species details.
   - Use the order page to build a grouped quote request and submit it (no prices).
   - Receive an order-received email, then status updates.
   - Track the shipment at `/track` once a waybill has been issued.

2. Client-specific price list flow:
   - Open a private link `/orders/[slug]?token=…` sent by the INÁ team.
   - View custom pricing and place a priced order. The link only works while the
     list is active and within its valid-from / valid-until dates.

3. Admin flow:
   - Sign in at `/login` with an admin account.
   - Manage species, client profiles, price lists, location pricing, gallery assets, blog posts, and orders.
   - Review submitted orders, update status, and send notifications.
   - Record the Air Waybill and advance the shipment stage as the cargo flies.

4. Data and communication flow:
   - Supabase stores species, clients, orders, pricing, and gallery data.
   - Orders, clients and price lists are read and written only on the server
     (service-role key); row-level security gives the public read access to the
     catalogue tables and nothing else.
   - Nodemailer over SMTP handles transactional email.

## Security

The things to know before changing auth, data access, or public endpoints.

**Admin access.** Being signed in is not enough: an account must carry
`role: "admin"` in its Supabase `app_metadata`. Users can't edit `app_metadata`
themselves, only the service role can. The same rule is enforced in three places:

| Layer | Where |
| --- | --- |
| Admin pages (redirect to `/login`) | `src/proxy.ts` → `src/lib/supabase/middleware.ts`, `src/app/admin/layout.tsx` |
| Admin API routes (401) | `isAdmin()` / `getAdminUser()` in `src/lib/admin-auth.ts` |
| Database (RLS) | `public.is_admin()` in `supabase/migrations/0006_admin_role_rls.sql` |

Grant or revoke admin with SQL (then the user signs out and back in):

```sql
-- grant
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
 where lower(email) = 'someone@example.com';
-- revoke
update auth.users set raw_app_meta_data = raw_app_meta_data - 'role'
 where lower(email) = 'someone@example.com';
```

Keep **public sign-ups disabled** in the Supabase dashboard (Authentication →
Sign In / Providers).

**Public order API (`/api/orders`).** The server never trusts prices, names, or
client IDs from the browser. A priced order must include the price list's `slug`
and `token`; the list is re-validated and every line is priced from the
database. Orders without a price list are stored unpriced. Out-of-stock or
unknown species are rejected with a message naming them.

**Rate limiting** has two layers:

1. Nginx `limit_req` per IP, so floods get a cheap 429 before reaching Node
   (`deploy/nginx/inaornamentalfish.com.conf`).
2. In-app limits in `src/lib/rate-limit.ts`. Orders: 6/min and 20/hour per IP,
   5/hour per recipient email, plus a duplicate-submission lock.

The app reads the client IP from `X-Real-IP`, which nginx sets and clients can't
forge. The in-app limiter keeps its counts in process memory. That's correct for
the single-process production setup; if you ever run more than one instance,
move it to a shared store such as Redis.

**Other guards:**
- Blog HTML from WordPress is cleaned with `sanitize-html` (`src/lib/sanitize-html.ts`).
- Uploads are capped at 10 MB, and images are checked by their actual file
  content (raster formats only, no SVG) (`src/lib/upload-limits.ts`).
- The login page only redirects to paths on this site.

## Air Cargo Tracking

Rather than paying for a third-party tracking API, the app identifies the carrier
from the 3-digit IATA prefix of the Air Waybill and links the customer straight
into that airline's own cargo portal. Everything is derived from the AWB itself,
so there are no API keys, quotas, or per-lookup costs.

### Supported carriers

| Airline | AWB prefix | Tracking portal |
| --- | --- | --- |
| Lufthansa Cargo | `020` | `lufthansa-cargo.com/en/eservices/etracking` |
| Turkish Cargo | `235` | `turkishcargo.com/en/cargo-tracking` |
| Ethiopian Cargo | `071` | `ethiopiancargo.azurewebsites.net/my-cargo/track-your-shipment` |
| Qatar Airways Cargo | `157` | `qrcargo.com/s/track-your-shipment` |
| Emirates SkyCargo | `176` | `eskycargo.emirates.com/app/offerandorder` |
| Delta Cargo | `006` | `deltacargo.com/Cargo/trackShipment` |
| Kenya Airways Cargo | `706` | `kqcargo.com/en/#4` |

None of the seven accept the waybill as a query parameter, so every link lands
on the carrier's tracking page and the customer enters the number themselves.
The UI and the emails say so explicitly — and show the waybill to copy — rather
than implying a prefill that doesn't happen. The template mechanism supports
deep links (`{prefix}`, `{serial}`, `{awb}`) for whenever a carrier adds one.

### How it fits together

| Piece | Location |
| --- | --- |
| Carrier registry + `getAirlineTrackingUrl()` | `src/lib/tracking/airlines.ts` |
| Unit tests for the resolver | `src/lib/tracking/airlines.test.ts` |
| Customer-facing tracking card | `src/components/order/ShipmentTrackingCard.tsx` |
| Public lookup page | `src/app/track/` |
| Public lookup API (rate-limited) | `src/app/api/track/route.ts` |
| Admin AWB + shipment-stage editor | `src/app/admin/orders/ShipmentTrackingEditor.tsx` |
| Database columns | `supabase/migrations/0004_shipment_tracking.sql` |

`getAirlineTrackingUrl(awb)` sanitizes the input (whitespace, hyphens, dots),
requires exactly 11 digits — a 3-digit prefix plus an 8-digit serial — and
returns `{ airlineName, prefix, serial, formattedAwb, trackingUrl, prefilled,
checkDigitValid }`. An unrecognised prefix returns a formatted AWB with a null
airline and URL rather than an invented link.

### Admin workflow

Expand an order in **Admin → Orders** and use the *Air cargo tracking* panel:

1. Enter the AWB in any format (`071-12345678`, `071 1234 5678`, `07112345678`).
   The carrier is detected as you type, and a failed IATA modulus-7 check digit
   raises a typo warning.
2. **Save AWB** — the API re-resolves the number server-side and stores
   `awb_number`, `carrier_prefix`, and `airline_name`.
3. Set the shipment stage: `BOOKED → DEPARTED → IN_TRANSIT → ARRIVED → DELIVERED`.

This is deliberately separate from the order's commercial `status`
(`submitted`, `confirmed`, …). Order-status emails include the waybill and a
tracking link once an AWB exists.

### Customer workflow

At `/track`, a customer enters their order reference and the email they ordered
with. Orders aren't publicly readable under RLS, so the lookup runs server-side
with the service-role key, gated on that pair, rate-limited per IP, and returns
one identical message for "no such reference" and "wrong email" so the endpoint
can't be used to enumerate orders.

### Adding or correcting a carrier

Edit `AIR_CARRIERS` in `src/lib/tracking/airlines.ts` — it's the single source of
truth for the admin editor, the customer card, and the API. In `urlTemplate`, the
placeholders `{prefix}`, `{serial}`, and `{awb}` (the hyphenated form) are
substituted; a template with no placeholder is treated as a portal landing page.
Run `npm test` afterwards — the suite asserts every registered carrier resolves
to an https URL with no unsubstituted placeholders.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Turbopack)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Styling**: Tailwind CSS 4 with custom theme (River Green `#3b655d`, Dawn Gold `#d4a85f`)
- **UI Components**: shadcn/ui (Base UI primitives)
- **State**: Zustand, TanStack React Query
- **Email**: Nodemailer over SMTP
- **Documents**: ExcelJS (invoices, price lists, imports), PDFKit
- **HTML sanitising**: sanitize-html (WordPress blog content)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Tests**: `node:test` via tsx

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Providers + LayoutShell
│   ├── page.tsx                # Homepage
│   ├── about/                  # About page
│   ├── catalogue/              # Species catalogue
│   ├── contact/                # Contact page
│   ├── order/                  # Public order form
│   ├── orders/[slug]/          # Client-specific price list orders
│   ├── track/                  # Public shipment tracking lookup
│   ├── gallery/                # Photo gallery
│   ├── blog/                   # Blog (headless WordPress)
│   ├── login/                  # Admin login
│   ├── error.tsx               # Error boundaries (+ global-error.tsx)
│   ├── admin/                  # Admin dashboard (+ error.tsx, loading.tsx)
│   │   ├── clients/            # Client management
│   │   ├── species/            # Species CRUD, import/export
│   │   ├── orders/             # Order management + AWB tracking editor
│   │   ├── pricing/            # Client price lists
│   │   ├── location-pricing/   # Regional master price sheets
│   │   ├── blog/               # Blog posts + categories
│   │   ├── gallery/            # Gallery management
│   │   └── settings/           # Site settings, SMTP test
│   └── api/
│       ├── orders/             # Public order submission (server-priced)
│       ├── track/              # Public shipment lookup
│       ├── instagram/sync/     # Instagram feed refresh (admin or cron secret)
│       └── admin/              # Admin-only API routes
├── components/
│   ├── layout/                 # Header, Footer, LayoutShell
│   ├── catalogue/              # Catalogue UI components
│   ├── order/                  # Order form + shipment tracking card
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── admin-auth.ts           # isAdmin() / getAdminUser()
│   ├── email.ts                # SMTP email templates
│   ├── excel.ts, csv.ts        # Spreadsheet parsing/serialising helpers
│   ├── species-write.ts        # Field allow-list + safe image replace for species
│   ├── sanitize-html.ts        # Blog HTML sanitiser
│   ├── upload-limits.ts        # Upload size/type checks
│   ├── rate-limit.ts           # In-app throttling + duplicate-submit lock
│   ├── format.ts               # Shared date/currency formatting
│   ├── tracking/               # AWB carrier registry + deep-link resolver
│   ├── supabase/               # Supabase clients + fetchAllRows() pagination
│   └── queries/                # Data fetching utilities
├── store/                      # Zustand stores
├── types/                      # TypeScript type definitions
└── proxy.ts                    # Route protection (Next 16 proxy)

supabase/
├── schema.sql                  # Full schema for a fresh database
├── migrations/                 # Incremental migrations, applied in order
└── seed.ts                     # Seed data

deploy/                         # Nginx, systemd and the deployment runbook
```

### Conventions worth knowing

- **Paginate unbounded reads.** Supabase returns at most 1000 rows per request
  and silently drops the rest. Any query on a table that can grow should go
  through `fetchAllRows()` (`src/lib/supabase/paginate.ts`) and be ordered on a
  unique key (add `.order("id")` as a tiebreak).
- **Check every Supabase `error`.** Throw in server components, so the error
  boundary shows. Return a clear message in API routes, and log the raw database
  error rather than sending it to the browser.
- **Don't delete before you insert.** When replacing a set of rows, insert the
  new rows first and then delete the old ones by id, or do the whole replace in
  one database function. `replace_location_pricing()` in migration 0007 is an
  example.

## Getting Started

### Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- A Supabase project

### Environment Variables

Copy `.env.example` to `.env.local` and fill it in. It lists every variable the
app reads, with a note on each. The important ones:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public; safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only**, bypasses RLS. Never prefix it with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Builds links in emails and the sitemap; set the real domain in production |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `ADMIN_EMAIL` | Email is skipped entirely when `SMTP_USER`/`SMTP_PASS` are absent. `ADMIN_EMAIL` takes a comma-separated list |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4. Off when unset, off in development, and never loaded on `/admin`, `/login` or `/orders` |
| `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` | Headless WordPress for the blog and media uploads |
| `BEHOLD_FEED_URL`, `CRON_SECRET` | Instagram feed, and the secret for scheduled `POST /api/instagram/sync` |

### Database Setup

1. **Fresh database:** run `supabase/schema.sql` in the Supabase SQL editor.
   **Existing database:** apply everything in `supabase/migrations/` in filename
   order. Each migration is idempotent and safe to re-run.
2. `0006_admin_role_rls.sql` grants the admin role to the accounts listed in it,
   and aborts without changing anything if any of them doesn't exist yet. Create
   those Supabase users first, or edit the list for your own environment.
3. Disable public sign-ups in the Supabase dashboard.
4. Admins sign out and back in after the role is granted.

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no output files) |
| `npm test` | Run the unit test suite |
| `npm run test:watch` | Re-run tests on change |

## Troubleshooting

**`'next' is not recognized`, or `npm install` fails with `EALLOWREMOTE … Refusing to fetch`.**
npm 12 refuses to download packages from a registry other than the configured
one. That happens if `package-lock.json` was generated against a mirror (for
example `registry.npmmirror.com`) while your npm uses `registry.npmjs.org`, and
the install stops before `next` is installed. Keep the lockfile on the official
registry: if it contains mirror URLs, delete it, run `npm install` to regenerate
it, and commit the result. `npm config get registry` shows which registry you're
using.

**`npm warn install-scripts … blocked`** is npm 12 not running packages' install
scripts unless they're explicitly allowed. The app, tests and lint all work
without them. `npm install-scripts ls` lists what was skipped.

**`/admin` keeps sending you back to `/login`, or says the account has no admin access.**
The account is missing the `admin` role, or the session predates the grant.
Grant the role (see [Security](#security)), then sign out and back in.

**`npm run build` fails at "Generating static pages" with `supabaseUrl is required`.**
Some pages fetch data while building, so the build needs real Supabase values in
`.env.local` or `.env.production`.

**`npm run dev` hangs, or the build fails with `Cannot find module '@tailwindcss/postcss'`.**
Check whether `NODE_ENV` is set to `production` in your shell or system
environment. npm reads it and omits devDependencies, so Tailwind never gets
installed — and `npm install` will then report "up to date" while the package is
still missing. Unset it, or install with an explicit override:

```bash
npm install --include=dev
```

On Windows, clear a machine-level variable from an elevated PowerShell with
`[Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'Machine')`, then
restart the terminal.

## Deployment

Production runs on an Ubuntu server as a single `next start` process, managed
by systemd, behind Nginx. WordPress stays on the same domain for `/wp-admin` and
media. The full runbook is [`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md), covering
first-time setup, TLS, smoke tests, rollback, and the release checklist for
schema changes.

Nginx does more than route requests. It also:
- throttles each IP before requests reach Node;
- serves `/_next/static` directly from disk;
- caches optimised images (`/_next/image`) for 30 days, so each image size is
  resized only once.

When changing `deploy/nginx/`, run `sudo nginx -t` before reloading.

**CI/CD (GitHub Actions)**

- `.github/workflows/ci.yml` runs lint, type-check, tests, a dependency audit and
  a production build on every push and pull request.
- `.github/workflows/deploy.yml` deploys `main` after CI passes. The build runs on
  GitHub's machines, and the server switches releases atomically, rolling back
  automatically if the health check fails.
- `.github/workflows/vercel.yml` gives every pull request a Vercel preview
  deployment and posts its URL on the PR. A Vercel production deploy only runs
  when started by hand. Previews should point at a separate test database (see
  [DEPLOYMENT.md §9](deploy/DEPLOYMENT.md)).
- Dependabot opens weekly dependency update PRs.
- Database migrations are always applied by hand.

One-time setup and the list of required secrets are in
[`deploy/DEPLOYMENT.md` §8](deploy/DEPLOYMENT.md).

`netlify.toml` is still in the repo, but Netlify isn't the production target.
Note that the in-memory rate limiter assumes a single process (see
[Security](#security)).
