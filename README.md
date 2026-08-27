# INA Ornamental Fish

A full-stack web application for INA Ornamental Fish — an ornamental fish export company. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Public Catalogue** — Browse species with filtering, search, and detailed modals
- **Online Ordering** — Multi-group order form with species selection and quantity management
- **Client Price Lists** — Unique shareable links with custom pricing per client
- **Air Cargo Tracking** — Deep-links each shipment's Air Waybill into the airline's own cargo portal (no paid tracking API)
- **Admin Dashboard** — Manage species, clients, orders, pricing, and gallery
- **Email Notifications** — Automated order confirmations and status updates
- **Authentication** — Supabase Auth with proxy-protected admin routes

## App Flow

1. Public user flow:
   - Visit the homepage and explore featured species.
   - Open the catalogue to search, filter, and view species details.
   - Use the order page to build a grouped order, select quantities, and submit.
   - Receive order confirmation and status updates via email.
   - Track the shipment at `/track` once a waybill has been issued.

2. Client-specific price list flow:
   - Access a unique client link under `/orders/[slug]`.
   - View custom pricing and place orders with client-specific rates.

3. Admin flow:
   - Log in through the protected admin area.
   - Manage species, client profiles, pricing rules, gallery assets, and orders.
   - Review submitted orders, update status, and send notifications.
   - Record the Air Waybill and advance the shipment stage as the cargo flies.

4. Data and communication flow:
   - Supabase stores species, clients, orders, pricing, and gallery data.
   - A proxy (`src/proxy.ts`) protects admin routes and API access.
   - Nodemailer over SMTP handles transactional email for order confirmations and updates.

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
- **Documents**: ExcelJS (invoices, price lists), PDFKit
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
│   ├── login/                  # Admin login
│   ├── admin/                  # Admin dashboard
│   │   ├── clients/            # Client management
│   │   ├── species/            # Species CRUD
│   │   ├── orders/             # Order management + AWB tracking editor
│   │   ├── pricing/            # Client price lists
│   │   └── gallery/            # Gallery management
│   └── api/
│       ├── orders/             # Public order submission
│       ├── track/              # Public shipment lookup
│       └── admin/              # Protected admin API routes
│           ├── clients/
│           ├── species/
│           ├── orders/
│           └── pricing/
├── components/
│   ├── layout/                 # Header, Footer, LayoutShell
│   ├── catalogue/              # Catalogue UI components
│   ├── order/                  # Order form + shipment tracking card
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── email.ts                # SMTP email templates
│   ├── tracking/               # AWB carrier registry + deep-link resolver
│   ├── supabase/               # Supabase client helpers
│   ├── queries/                # Data fetching utilities
│   ├── rate-limit.ts           # In-memory throttling for public endpoints
│   └── hooks/                  # Custom React hooks
├── store/                      # Zustand stores
├── types/                      # TypeScript type definitions
├── data/                       # Static data
└── proxy.ts                    # Route protection (Next 16 proxy)

supabase/
├── schema.sql                  # Full schema for a fresh database
├── migrations/                 # Incremental migrations, applied in order
└── seed.ts                     # Seed data
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number

# Transactional email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=orders@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

`NEXT_PUBLIC_SITE_URL` builds the tracking link in status emails, so set it to
the real domain in production. Email sending is skipped entirely when
`SMTP_USER` / `SMTP_PASS` are absent.

### Database Setup

1. Run `supabase/schema.sql` in the Supabase SQL editor for a fresh database.
2. Apply everything in `supabase/migrations/` in filename order. Each migration
   is idempotent and safe to re-run. An existing database needs at least
   `0004_shipment_tracking.sql` before the tracking feature will work.

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
| `npm test` | Run the unit test suite |
| `npm run test:watch` | Re-run tests on change |

## Troubleshooting

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

Deploy on [Netlify](https://netlify.com) (see `netlify.toml`), [Vercel](https://vercel.com),
or any Node.js hosting platform. Set all environment variables in your hosting
provider's dashboard.
