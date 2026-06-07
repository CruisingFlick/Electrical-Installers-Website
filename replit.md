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

### Messaging (Customer ↔ Admin)
- **Message Us** (`/messages`) — customers start a private thread with name+phone (email + booking/quote reference optional), send messages and attach photos. Conversation persists via `localStorage` thread id; polls for admin replies.
- **Admin → Messages** (`/admin/messages`) — inbox of threads with unread badges; admin replies (with photo support), changes status (open/closed). Email notification sent to `BUSINESS_EMAIL` on each new customer message.
- Tables: `threads` + `thread_messages` in `lib/db/src/schema/threads.ts` (separate from AI-chat `conversations`/`messages`). Photos stored as base64 data URLs.

### Public-facing Pages
- **Home** (`/`) — hero section, service cards, portfolio highlights, customer reviews, CTA
- **Services** (`/services`) — detailed service descriptions with images + links to detailed service guides
- **Service Detail** (`/services/:slug`) — CMS-driven detailed service page (DB-backed, admin editable)
- **Suburb landing** (`/:slug`) — CMS-driven suburb/service-area landing pages (catch-all route, before NotFound)
- **Underground Power** (`/underground-power`) — 5-step United Energy process guide with disclaimer
- **Portfolio** (`/portfolio`) — before/after photo grid with category filtering + before/after slider in lightbox
- **Pricing** (`/pricing`) — indicative price ranges (CMS-driven, admin editable)
- **FAQ** (`/faq`) — frequently asked questions accordion (CMS-driven, admin editable)
- **Reviews** (`/reviews`) — live Google rating badge + Google reviews (when configured), approved customer reviews + submit review form (pending moderation)
- **Blog/Tips & Guides** (`/blog`, `/blog/:slug`) — articles with a Related Articles section (same-category first, ≤3)
- **Book** (`/book`) — booking form (consulting/quoting/work) with reference number + thank-you confirmation + track link
- **Track Booking** (`/track`) — booking status stepper, lookup by reference number
- **Quote** (`/quote`) — virtual quote form with photo URL fields, thank-you confirmation

### AI Chat Widget (`ChatWidget.tsx`)
- Streaming AI chat via `/api/openai/conversations`
- **Request a callback** lead-capture form — posts to `/api/threads` (admin Messages inbox) with `referenceType: "callback"`; name + phone required

### Admin Dashboard (`/admin`)
- **Login** — password set via `ADMIN_PASSWORD` secret; auth uses server-side session cookie (express-session), no localStorage
- **Dashboard** — analytics stats + recharts bar charts (bookings by service, by region)
- **Bookings** — table with status change dropdowns (pending/confirmed/scheduled/completed/cancelled)
- **Portfolio** — add/delete portfolio items via modal form
- **Reviews** — moderation queue (pending/approve/reject/delete)
- **Quotes** — review quote requests with status workflow and photo links
- **FAQ / Pricing / Service Pages / Suburb Pages** — config-driven CRUD via generic `admin/CmsManager.tsx` (4 thin wrappers); each backed by its own public+admin Express router
- **Site Settings** — Google Reviews link + Google Place ID (for live reviews)
- **Job Map** — Leaflet map centred on Mornington Peninsula; orange pins = pending, green = accepted/in_progress/completed; add/remove jobs

### CMS Feature Routes (FAQ, Pricing, Service Pages, Suburb Pages, Google Reviews)
- These newer routes use **local Zod + raw fetch** (NOT OpenAPI/Orval codegen), matching the blog/settings pattern. Public pages use TanStack `useQuery` + `src/lib/cms.ts` helpers (`apiGet`/`apiSend`).
- Each router exposes a public read router (`/faqs`, `/pricing`, `/service-pages`, `/suburb-pages`) and an admin CRUD router (`/admin/...`) guarded by `requireAdmin`.
- **Google Reviews** (`/api/google-reviews`): lazy 24h cache in `google_reviews_cache` table; needs `GOOGLE_PLACES_API_KEY` secret + `googlePlaceId` setting. Degrades gracefully (returns `configured:false`) when either is missing; serves stale cache on upstream failure. API key stays server-side only.

## Colour Scheme
- Primary (navy): `hsl(214, 60%, 14%)`
- Accent (orange): `hsl(25, 95%, 53%)`
- Background: `hsl(210, 20%, 98%)` (near white)

## Database Schema (Drizzle)

Tables in `lib/db/src/schema/index.ts`:
- `bookings` — customer booking requests (with `referenceNumber` `EI-{year}-{id padded 4}`; status: pending/confirmed/scheduled/completed/cancelled)
- `portfolio_items` — completed job showcase with before/after images
- `reviews` — customer reviews (status: pending/approved/rejected)
- `quotes` — virtual quote requests with photo URLs
- `jobs` — job map entries with lat/lng coordinates, priority, estimatedDuration, totalAmount (numeric), clientName, clientPhone, clientEmail
- `faqs` — FAQ entries (question/answer/sortOrder)
- `pricing_items` — pricing guide rows (label/priceRange/description/sortOrder)
- `service_pages` — CMS service detail pages (slug-based)
- `suburb_pages` — CMS suburb landing pages (slug-based)
- `blog_posts` — articles (slug, category, excerpt, content, published)
- `google_reviews_cache` — cached Google Places rating + reviews (24h lazy refresh)
- `settings` — key/value store (`googleReviewsUrl`, `googlePlaceId`)

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
