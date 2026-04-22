# Electrical Installers - Business Website

## Overview

Full-stack business website for "Electrical Installers" serving Mornington Peninsula, St Kilda, and Warragul, Victoria. Built as a pnpm workspace monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS v4 (at `/`)
- **Backend**: Express 5 API server (at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Routing**: wouter (frontend), Express 5 (backend)
- **Data fetching**: TanStack Query with Orval-generated hooks
- **Validation**: Zod, drizzle-zod
- **Charts**: recharts (admin analytics dashboard)
- **Maps**: react-leaflet + leaflet (OpenStreetMap) for job map
- **Email**: nodemailer (best-effort, requires SMTP env vars)
- **API codegen**: Orval (from OpenAPI spec)

## Features

### Public-facing Pages
- **Home** (`/`) — hero section, service cards, portfolio highlights, customer reviews, CTA
- **Services** (`/services`) — detailed service descriptions with images
- **Underground Power** (`/underground-power`) — 5-step United Energy process guide with disclaimer
- **Portfolio** (`/portfolio`) — before/after photo grid with category filtering
- **Reviews** (`/reviews`) — approved customer reviews + submit review form (pending moderation)
- **Book** (`/book`) — booking form (consulting/quoting/work) with thank-you confirmation
- **Quote** (`/quote`) — virtual quote form with photo URL fields, thank-you confirmation

### Admin Dashboard (`/admin`)
- **Login** — password: `admin123`, stored in localStorage as `admin_auth = "true"`
- **Dashboard** — analytics stats + recharts bar charts (bookings by service, by region)
- **Bookings** — table with status change dropdowns (pending/confirmed/completed/cancelled)
- **Portfolio** — add/delete portfolio items via modal form
- **Reviews** — moderation queue (pending/approve/reject/delete)
- **Quotes** — review quote requests with status workflow and photo links
- **Job Map** — Leaflet map centred on Mornington Peninsula; orange pins = pending, green = accepted/in_progress/completed; add/remove jobs

## Colour Scheme
- Primary (navy): `hsl(214, 60%, 14%)`
- Accent (orange): `hsl(25, 95%, 53%)`
- Background: `hsl(210, 20%, 98%)` (near white)

## Database Schema (Drizzle)

Tables in `lib/db/src/schema/index.ts`:
- `bookings` — customer booking requests
- `portfolio_items` — completed job showcase with before/after images
- `reviews` — customer reviews (status: pending/approved/rejected)
- `quotes` — virtual quote requests with photo URLs
- `jobs` — job map entries with lat/lng coordinates

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
  - After codegen, run: `echo 'export * from "./generated/api";' > lib/api-zod/src/index.ts`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Email Configuration (Optional)

Set these env vars to enable thank-you emails on booking/quote submissions:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Emails are best-effort — the request will succeed even if SMTP is not configured.

## Workflows

- `artifacts/api-server: API Server` — Express API server
- `artifacts/electrical-installers: web` — React + Vite frontend

## Architecture Notes

- Generated API hooks live in `lib/api-client-react/src/generated/api.ts`
- `lib/api-zod/src/index.ts` must only export `./generated/api` — codegen regenerates it
- Leaflet default icon fix applied in `JobMap.tsx` (delete `_getIconUrl` from prototype)
- Admin auth guard: `AdminGuard` component in `App.tsx` checks localStorage before rendering protected routes
