# INA Ornamental Fish

A full-stack web application for INA Ornamental Fish — an ornamental fish export company. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Public Catalogue** — Browse species with filtering, search, and detailed modals
- **Online Ordering** — Multi-group order form with species selection and quantity management
- **Client Price Lists** — Unique shareable links with custom pricing per client
- **Admin Dashboard** — Manage species, clients, orders, pricing, and gallery
- **Email Notifications** — Automated order confirmations and status updates via Resend
- **Authentication** — Supabase Auth with middleware-protected admin routes

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Styling**: Tailwind CSS 4 with custom theme (River Green `#3b655d`, Dawn Gold `#d4a85f`)
- **UI Components**: shadcn/ui (Base UI primitives)
- **State**: Zustand, TanStack React Query
- **Email**: Resend SDK
- **Animations**: Framer Motion
- **Icons**: Lucide React

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
│   ├── gallery/                # Photo gallery
│   ├── login/                  # Admin login
│   ├── admin/                  # Admin dashboard
│   │   ├── clients/            # Client management
│   │   ├── species/            # Species CRUD
│   │   ├── orders/             # Order management
│   │   ├── pricing/            # Client price lists
│   │   └── gallery/            # Gallery management
│   └── api/
│       ├── orders/             # Public order submission
│       └── admin/              # Protected admin API routes
│           ├── clients/
│           ├── species/
│           ├── orders/
│           └── pricing/
├── components/
│   ├── layout/                 # Header, Footer, LayoutShell
│   ├── catalogue/              # Catalogue UI components
│   ├── order/                  # Order form components
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── email.ts                # Resend email templates
│   ├── supabase/               # Supabase client helpers
│   ├── queries/                # Data fetching utilities
│   └── hooks/                  # Custom React hooks
├── store/                      # Zustand stores
├── types/                      # TypeScript type definitions
└── data/                       # Static data
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the schema from `supabase/schema.sql`

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=your_whatsapp_number
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=orders@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy on [Vercel](https://vercel.com) or any Node.js hosting platform. Set all environment variables in your hosting provider's dashboard.
