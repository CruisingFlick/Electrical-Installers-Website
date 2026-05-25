# Project Overview — Electrical Installers

> Generated: 25 May 2026

---

## 1. Project Summary

### Purpose
A full-stack business website for **Electrical Installers**, a licensed electrical contracting company (REC 25510, ABN 35 608 171 802) serving the Mornington Peninsula, St Kilda, and Warragul areas in Victoria, Australia.

The site serves two audiences:
- **Public visitors** — learn about services, view completed work, submit booking/quote requests, read and leave reviews, and chat with an AI assistant.
- **Admin (business owner)** — manage bookings, quotes, reviews, portfolio items, job map, customers, media library, calendar, and AI chat settings through a password-protected dashboard.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Component library | shadcn/ui (Radix UI primitives) |
| Frontend routing | wouter v3 |
| Data fetching | TanStack Query v5 with Orval-generated hooks |
| Backend framework | Express 5 (TypeScript, ESM) |
| Database | PostgreSQL via Drizzle ORM v0.45 |
| Schema validation | Zod v3 + drizzle-zod |
| Email | nodemailer v8 (SMTP, best-effort) |
| SMS | Twilio SDK v6 (best-effort) |
| AI chat | OpenAI GPT-4o-mini via Replit AI integration, streamed SSE |
| Maps | react-leaflet v5 + Leaflet v1.9 (OpenStreetMap) |
| Charts | recharts v2 |
| Monorepo | pnpm workspaces |
| Hosting | Replit (reverse-proxy path-based routing) |

### Entry Points

| File | Role |
|---|---|
| `artifacts/electrical-installers/src/main.tsx` | React app bootstrap |
| `artifacts/electrical-installers/src/App.tsx` | Route definitions, QueryClient, AdminGuard |
| `artifacts/api-server/src/index.ts` | Express server bootstrap (reads `PORT`, starts listener) |
| `artifacts/api-server/src/app.ts` | Express app setup (middleware, session, router mount) |

---

## 2. File & Folder Structure

```
workspace/
├── artifacts/
│   ├── electrical-installers/          # React + Vite frontend
│   │   ├── public/                     # Static assets (images, favicon, manifest)
│   │   │   ├── logo.png
│   │   │   ├── favicon.png / favicon.svg
│   │   │   ├── opengraph.jpg
│   │   │   ├── manifest.webmanifest
│   │   │   ├── underground-power.jpg
│   │   │   ├── new-homes.jpg
│   │   │   ├── commercial-industrial.jpg
│   │   │   ├── portfolio-new-houses.jpg
│   │   │   ├── 3phase-before.jpg
│   │   │   └── 3phase-after.jpg
│   │   ├── src/
│   │   │   ├── main.tsx                # React entry point
│   │   │   ├── App.tsx                 # Router, AdminGuard, PublicLayout
│   │   │   ├── index.css               # Tailwind CSS v4 entry + theme variables
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx            # Landing page
│   │   │   │   ├── About.tsx           # About page
│   │   │   │   ├── Services.tsx        # Services overview
│   │   │   │   ├── UndergroundPower.tsx # 5-step United Energy guide
│   │   │   │   ├── Portfolio.tsx       # Before/after photo grid
│   │   │   │   ├── Reviews.tsx         # Approved reviews + submit form
│   │   │   │   ├── Book.tsx            # Booking form
│   │   │   │   ├── Quote.tsx           # Virtual quote form
│   │   │   │   ├── ServiceArea.tsx     # Service area map/info
│   │   │   │   ├── PrivacyPolicy.tsx   # Privacy policy
│   │   │   │   ├── not-found.tsx       # 404 page
│   │   │   │   └── admin/
│   │   │   │       ├── Login.tsx           # Admin login form
│   │   │   │       ├── AdminLayout.tsx     # Shared admin sidebar layout
│   │   │   │       ├── Dashboard.tsx       # Stats cards + recharts bar charts
│   │   │   │       ├── Bookings.tsx        # Bookings table + status management
│   │   │   │       ├── BookingDetailDrawer.tsx # Slide-out booking detail
│   │   │   │       ├── Portfolio.tsx       # Portfolio CRUD modal
│   │   │   │       ├── Reviews.tsx         # Review moderation queue
│   │   │   │       ├── Quotes.tsx          # Quote requests table
│   │   │   │       ├── JobMap.tsx          # Leaflet map with job pins
│   │   │   │       ├── CalendarView.tsx    # Calendar of bookings by date
│   │   │   │       ├── MediaLibrary.tsx    # Upload/manage images (base64 in DB)
│   │   │   │       ├── Customers.tsx       # Customer CRM table
│   │   │   │       └── AiSettings.tsx      # Edit AI system prompt
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx          # Top navigation bar
│   │   │   │   ├── Footer.tsx          # Site footer with links
│   │   │   │   ├── ChatWidget.tsx      # Floating AI chat widget (SSE streaming)
│   │   │   │   ├── ShareButton.tsx     # Web Share API / clipboard button
│   │   │   │   ├── QrButton.tsx        # QR code generator (qrcode.react)
│   │   │   │   └── ui/                 # shadcn/ui components (accordion, button,
│   │   │   │                           #   dialog, form, input, select, table, etc.)
│   │   │   ├── hooks/
│   │   │   │   ├── use-mobile.tsx      # Breakpoint hook (< 768px)
│   │   │   │   └── use-toast.ts        # Toast queue hook
│   │   │   ├── lib/
│   │   │   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   │   │   └── utils/
│   │   │       └── formatPhone.ts      # Phone number formatting helper
│   │   ├── index.html                  # HTML shell
│   │   ├── vite.config.ts              # Vite config (reads PORT + BASE_PATH env)
│   │   ├── tsconfig.json
│   │   ├── components.json             # shadcn/ui config
│   │   └── .replit-artifact/
│   │       └── artifact.toml           # Proxy routing: paths=["/"], static serve
│   │
│   ├── api-server/                     # Express 5 API server
│   │   ├── src/
│   │   │   ├── index.ts                # Server entry (reads PORT, calls app.listen)
│   │   │   ├── app.ts                  # Express setup: CORS, pino-http, session, router
│   │   │   ├── routes/
│   │   │   │   ├── index.ts            # Mounts all route modules under /api
│   │   │   │   ├── health.ts           # GET /healthz, GET /health
│   │   │   │   ├── admin-login.ts      # POST /admin/login, GET /admin/me, DELETE /admin/logout
│   │   │   │   ├── bookings.ts         # Bookings CRUD + email + SMS
│   │   │   │   ├── portfolio.ts        # Portfolio CRUD + reorder
│   │   │   │   ├── reviews.ts          # Reviews CRUD + moderation
│   │   │   │   ├── quotes.ts           # Quotes CRUD + email + SMS
│   │   │   │   ├── jobs.ts             # Jobs CRUD (job map)
│   │   │   │   ├── analytics.ts        # Dashboard stats + chart data
│   │   │   │   ├── customers.ts        # Customers CRM (read + patch)
│   │   │   │   ├── media.ts            # Media library CRUD (base64 images in DB)
│   │   │   │   ├── openai.ts           # AI chat conversations + SSE message streaming
│   │   │   │   └── ai-settings.ts      # Read/write AI system prompt
│   │   │   ├── middleware/
│   │   │   │   └── admin-auth.ts       # requireAdmin middleware (checks session.isAdmin)
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts           # Pino logger singleton
│   │   │   │   └── sms.ts              # Twilio SMS helper (best-effort)
│   │   │   └── types/
│   │   │       └── session.d.ts        # express-session type augmentation (isAdmin flag)
│   │   ├── build.mjs                   # esbuild bundle script
│   │   ├── tsconfig.json
│   │   └── .replit-artifact/
│   │       └── artifact.toml           # Proxy routing: paths=["/api"], port 8080
│   │
│   └── mockup-sandbox/                 # Design/canvas preview server (Vite, /__mockup)
│
├── lib/
│   ├── db/                             # @workspace/db — Drizzle ORM + schema
│   │   ├── src/
│   │   │   ├── index.ts                # Exports db client + all table objects
│   │   │   └── schema/
│   │   │       ├── index.ts            # Re-exports all schema files
│   │   │       ├── bookings.ts
│   │   │       ├── portfolio.ts
│   │   │       ├── reviews.ts
│   │   │       ├── quotes.ts
│   │   │       ├── jobs.ts
│   │   │       ├── customers.ts
│   │   │       ├── conversations.ts
│   │   │       ├── messages.ts
│   │   │       ├── media.ts
│   │   │       └── settings.ts
│   │   └── drizzle.config.ts           # Drizzle Kit config (reads DATABASE_URL)
│   │
│   ├── api-spec/                       # @workspace/api-spec — OpenAPI spec + Orval codegen
│   │   └── orval.config.ts             # Codegen config (generates api-client-react + api-zod)
│   │
│   ├── api-client-react/               # @workspace/api-client-react — TanStack Query hooks
│   │   └── src/
│   │       ├── index.ts
│   │       ├── custom-fetch.ts         # Fetch wrapper (base URL, credentials)
│   │       └── generated/
│   │           ├── api.ts              # Generated React Query hooks
│   │           └── api.schemas.ts      # Generated TypeScript types
│   │
│   ├── api-zod/                        # @workspace/api-zod — Zod validation schemas
│   │   └── src/
│   │       ├── index.ts
│   │       └── generated/
│   │           └── api.ts              # Generated Zod schemas for all request/response shapes
│   │
│   └── integrations-openai-ai-server/  # @workspace/integrations-openai-ai-server
│       └── src/
│           ├── client.ts               # OpenAI client via Replit AI proxy
│           ├── audio/                  # Audio transcription/TTS helpers
│           ├── batch/                  # Batch job helpers
│           └── image/                  # Image generation helpers
│
├── scripts/                            # @workspace/scripts — utility scripts
├── pnpm-workspace.yaml                 # Workspace config + catalog version pins
├── tsconfig.base.json                  # Shared strict TS config
├── tsconfig.json                       # Solution-file for composite libs
├── package.json                        # Root dev tooling (typescript, eslint, etc.)
└── replit.md                           # Project README + user preferences
```

---

## 3. Frontend

### Pages and Routes

| Route | Component | Description |
|---|---|---|
| `/` | `Home.tsx` | Hero section, service cards, portfolio highlights, customer reviews snippet, CTAs |
| `/about` | `About.tsx` | About the business and team |
| `/services` | `Services.tsx` | Detailed service descriptions with images |
| `/underground-power` | `UndergroundPower.tsx` | 5-step United Energy underground power process guide with disclaimer |
| `/portfolio` | `Portfolio.tsx` | Before/after photo grid with category filter; reads from `/api/portfolio` |
| `/reviews` | `Reviews.tsx` | Approved reviews list + submit-review form (posts to `/api/reviews`) |
| `/book` | `Book.tsx` | Booking request form (consulting/quoting/work); posts to `/api/bookings` |
| `/quote` | `Quote.tsx` | Virtual quote form with three photo URL fields; posts to `/api/quotes` |
| `/service-area` | `ServiceArea.tsx` | Service area information |
| `/privacy-policy` | `PrivacyPolicyPage.tsx` | Privacy policy text |
| `/admin` | `Login.tsx` | Admin password login form; calls `POST /api/admin/login` |
| `/admin/dashboard` | `Dashboard.tsx` | Stats cards + recharts bar charts (bookings by service, by region) |
| `/admin/bookings` | `Bookings.tsx` | Bookings table, status dropdown, booking detail drawer, confirm with date/note |
| `/admin/portfolio` | `Portfolio.tsx` | Portfolio item grid + add/edit/delete modal |
| `/admin/reviews` | `Reviews.tsx` | Review moderation queue (approve/reject/delete) |
| `/admin/quotes` | `Quotes.tsx` | Quote requests table with status workflow |
| `/admin/jobs` | `JobMap.tsx` | Leaflet map; orange pins = pending, green = accepted/in_progress/completed; add/remove |
| `/admin/calendar` | `CalendarView.tsx` | Calendar view of bookings grouped by preferred date |
| `/admin/media` | `MediaLibrary.tsx` | Upload images (stored as base64 in DB), tag and categorise |
| `/admin/customers` | `Customers.tsx` | Customer CRM table with marketing notes and tags |
| `/admin/ai-settings` | `AiSettings.tsx` | Edit the AI chat system prompt |

All admin routes except `/admin` (login) are wrapped in `AdminGuard`, which calls `GET /api/admin/me` before rendering; unauthenticated requests redirect to `/admin`.

### Key Components

| Component | Purpose |
|---|---|
| `Navbar.tsx` | Responsive top navigation with mobile hamburger menu |
| `Footer.tsx` | Site footer with links, contact info, REC/ABN numbers |
| `ChatWidget.tsx` | Floating AI chat bubble (SSE streaming via `/api/openai/conversations`) with quick-question chips |
| `ShareButton.tsx` | Web Share API / clipboard share button |
| `QrButton.tsx` | Generates and displays a QR code for the current URL using `qrcode.react` |
| `AdminLayout.tsx` | Shared sidebar navigation for all admin pages |
| `BookingDetailDrawer.tsx` | Slide-out drawer showing full booking detail with confirm/status actions |

### CSS Framework and UI Libraries

- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/vite` plugin
- **shadcn/ui** — full set of Radix UI-based components (`accordion`, `alert-dialog`, `button`, `calendar`, `chart`, `dialog`, `drawer`, `form`, `input`, `select`, `table`, `tabs`, `toast`, `tooltip`, and more)
- **framer-motion** — page/element animation
- **lucide-react** — icon set
- **react-icons** — additional icons

Colour scheme (CSS custom properties):
- `--primary` (navy): `hsl(214, 60%, 14%)`
- `--accent` (orange): `hsl(25, 95%, 53%)`
- `--background`: `hsl(210, 20%, 98%)`

### How the Frontend Talks to the Backend

- All API calls go through **relative URLs** (e.g. `/api/bookings`) or via the `BASE_URL`-prefixed path — both resolve through Replit's shared reverse proxy.
- **TanStack Query v5** manages caching, loading, and error states; hooks are auto-generated by Orval from the OpenAPI spec into `lib/api-client-react/src/generated/api.ts`.
- A custom `custom-fetch.ts` wrapper passes `credentials: "same-origin"` for session cookies.
- The **AI chat widget** (`ChatWidget.tsx`) uses raw `fetch` with a manual **Server-Sent Events (SSE)** reader for streaming responses.
- **No axios or WebSockets** are used; everything is standard `fetch`.

---

## 4. Backend / API

The Express 5 app mounts all routes under `/api`. The full base path for every endpoint below is `/api`.

### Authentication Endpoints

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `POST` | `/api/admin/login` | None | Verifies password against `ADMIN_PASSWORD` env var; sets `session.isAdmin = true` | `{ password: string }` | `{ ok: true }` or 401 |
| `GET` | `/api/admin/me` | Session cookie | Returns whether the current session is authenticated | None | `{ isAdmin: true }` or 401 |
| `DELETE` | `/api/admin/logout` | `requireAdmin` | Destroys the session | None | 204 |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/healthz` | None | Returns `{ status: "ok" }` |
| `GET` | `/api/health` | None | Same as above |

### Bookings (`/api/bookings`)

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `GET` | `/api/bookings` | `requireAdmin` | List all bookings, optional `?status=` filter, ordered by `created_at DESC` | Query: `{ status? }` | `Booking[]` |
| `POST` | `/api/bookings` | None | Create a booking; fires email to customer + business and SMS to customer (best-effort) | `CreateBookingBody` | `Booking` (201) |
| `GET` | `/api/bookings/:id` | `requireAdmin` | Get a single booking by ID | Path param `id` | `Booking` or 404 |
| `PATCH` | `/api/bookings/:id` | `requireAdmin` | Update booking status; triggers customer upsert on `completed`/`cancelled` | `{ status }` | `Booking` |
| `PATCH` | `/api/bookings/:id/notes` | `requireAdmin` | Update admin notes on a booking | `{ adminNotes?: string }` | `Booking` |
| `POST` | `/api/bookings/:id/confirm` | `requireAdmin` | Set status to `confirmed`, send confirmation email + SMS to customer | `{ confirmedDate, adminNote? }` | `Booking` |
| `DELETE` | `/api/bookings/:id` | `requireAdmin` | Delete a booking | Path param `id` | 204 |

**`CreateBookingBody` fields:** `customerName`, `customerEmail`, `customerPhone?`, `serviceType`, `jobType`, `suburb`, `preferredDate`, `message?`, `photoUrl?`

**Booking statuses:** `pending`, `confirmed`, `completed`, `cancelled`

### Portfolio (`/api/portfolio`)

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `GET` | `/api/portfolio` | None | List items, optional `?category=` filter, ordered by `sort_order ASC`, `created_at DESC` | Query: `{ category? }` | `PortfolioItem[]` |
| `POST` | `/api/portfolio` | `requireAdmin` | Create a portfolio item | `CreatePortfolioItemBody` | `PortfolioItem` (201) |
| `PUT` | `/api/portfolio/reorder` | `requireAdmin` | Reorder items by providing ordered array of IDs | `{ ids: number[] }` | 204 |
| `PUT` | `/api/portfolio/:id` | `requireAdmin` | Update a portfolio item | `UpdatePortfolioItemBody` | `PortfolioItem` |
| `DELETE` | `/api/portfolio/:id` | `requireAdmin` | Delete a portfolio item | Path param `id` | 204 |

### Reviews (`/api/reviews`)

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `GET` | `/api/reviews` | None | List reviews, optional `?status=` filter, ordered by `created_at DESC` | Query: `{ status? }` | `Review[]` |
| `POST` | `/api/reviews` | None | Submit a new review (status defaults to `pending`, `isVerified = false`) | `CreateReviewBody` | `Review` (201) |
| `PATCH` | `/api/reviews/:id` | `requireAdmin` | Update review status | `{ status }` | `Review` |
| `DELETE` | `/api/reviews/:id` | `requireAdmin` | Delete a review | Path param `id` | 204 |

**Review statuses:** `pending`, `approved`, `rejected`

### Quotes (`/api/quotes`)

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `GET` | `/api/quotes` | `requireAdmin` | List all quote requests ordered by `created_at DESC` | None | `QuoteRequest[]` |
| `POST` | `/api/quotes` | None | Submit a quote request; fires email + SMS (best-effort) | `CreateQuoteBody` | `QuoteRequest` (201) |
| `PATCH` | `/api/quotes/:id` | `requireAdmin` | Update quote status | `{ status }` | `QuoteRequest` |

**`CreateQuoteBody` fields:** `customerName`, `customerEmail`, `customerPhone?`, `suburb`, `jobType`, `description`, `switchboardImageUrl?`, `fasciImageUrl?`, `streetImageUrl?`, `preferredDate?`, `preferredTime?`

**Quote statuses:** `pending`, `reviewing`, `quoted`, `accepted`, `declined`

### Jobs (`/api/jobs`)

| Method | Path | Auth | Description | Input | Output |
|---|---|---|---|---|---|
| `GET` | `/api/jobs` | `requireAdmin` | List all jobs ordered by `created_at DESC` | None | `Job[]` |
| `POST` | `/api/jobs` | `requireAdmin` | Create a job map pin | `CreateJobBody` | `Job` (201) |
| `PATCH` | `/api/jobs/:id` | `requireAdmin` | Update job status | `{ status }` | `Job` |
| `DELETE` | `/api/jobs/:id` | `requireAdmin` | Delete a job | Path param `id` | 204 |

**Job statuses:** `pending`, `accepted`, `in_progress`, `completed`, `cancelled`

### Analytics (`/api/analytics`) — all require `requireAdmin`

| Method | Path | Description | Output |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | Aggregate stats for dashboard cards | `{ totalBookings, pendingBookings, totalQuotes, pendingReviews, totalPortfolioItems, recentBookingsCount, topService, topRegion }` |
| `GET` | `/api/analytics/bookings-by-service` | Bookings grouped by `job_type` | `{ service, count }[]` |
| `GET` | `/api/analytics/bookings-by-region` | Bookings grouped by `suburb` | `{ region, count }[]` |

### Customers (`/api/admin/customers`) — all require `requireAdmin`

| Method | Path | Description | Input | Output |
|---|---|---|---|---|
| `GET` | `/api/admin/customers` | List all customers ordered by `updated_at DESC` | None | `Customer[]` |
| `GET` | `/api/admin/customers/:id` | Get single customer + their booking history | Path param `id` | `Customer & { bookings: Booking[] }` |
| `PATCH` | `/api/admin/customers/:id` | Update marketing notes or tags | `{ marketingNotes?, tags? }` | `Customer` |

### Media Library (`/api/admin/media`) — all require `requireAdmin`

| Method | Path | Description | Input | Output |
|---|---|---|---|---|
| `GET` | `/api/admin/media` | List all media items | None | `MediaItem[]` |
| `POST` | `/api/admin/media` | Upload a media item (base64 image data stored in DB) | `CreateMediaItemBody` | `MediaItem` (201) |
| `PATCH` | `/api/admin/media/:id` | Update title, category, or tags | `{ title?, category?, tags? }` | `MediaItem` |
| `DELETE` | `/api/admin/media/:id` | Delete a media item | Path param `id` | 204 |

### AI Settings (`/api/admin/ai-settings`) — all require `requireAdmin`

| Method | Path | Description | Input | Output |
|---|---|---|---|---|
| `GET` | `/api/admin/ai-settings` | Read the current AI system prompt (falls back to hardcoded default) | None | `{ systemPrompt: string }` |
| `PUT` | `/api/admin/ai-settings` | Upsert the AI system prompt in the `settings` table | `{ systemPrompt: string }` | `{ systemPrompt: string }` |

### AI Chat (OpenAI, `/api/openai`) — no auth required (public chat widget)

| Method | Path | Description | Input | Output |
|---|---|---|---|---|
| `POST` | `/api/openai/conversations` | Create a new conversation record | `{ title: string }` | `{ id, title, createdAt }` (201) |
| `GET` | `/api/openai/conversations/:id/messages` | List all messages in a conversation | Path param `id` | `Message[]` |
| `POST` | `/api/openai/conversations/:id/messages` | Send a user message; streams GPT-4o-mini reply back as SSE (`data: { content }` chunks, terminated by `data: { done: true }`) | `{ content: string }` | SSE stream |

### Authentication Method

Session-cookie authentication using **express-session** with a server-side session store. The session secret is read from `SESSION_SECRET` env var. The session cookie is `httpOnly`, `sameSite: lax`, with a 7-day `maxAge`. The `requireAdmin` middleware checks `req.session.isAdmin` and returns 401 if absent.

### Middleware Stack (applied in order in `app.ts`)

1. **pino-http** — structured HTTP request/response logging
2. **cors()** — permissive CORS (all origins)
3. **express.json({ limit: "50mb" })** — JSON body parsing (large limit for base64 image uploads)
4. **express.urlencoded({ extended: true, limit: "50mb" })** — URL-encoded body parsing
5. **express-session** — session management (secret from `SESSION_SECRET`)
6. **Router** — all route modules mounted at `/api`
7. **Global error handler** — catches any unhandled errors, logs via `req.log.error`, returns `{ error: message }` with HTTP 500

---

## 5. Database

- **Type:** PostgreSQL
- **ORM:** Drizzle ORM v0.45 with `drizzle-zod` for schema-derived validation
- **Connection:** `DATABASE_URL` environment variable (read by `lib/db/src/index.ts`)

### Tables

#### `bookings`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `customer_name` | `text` | Not null |
| `customer_email` | `text` | Not null |
| `customer_phone` | `text` | Nullable |
| `service_type` | `text` | Not null |
| `job_type` | `text` | Not null |
| `suburb` | `text` | Not null |
| `preferred_date` | `text` | Not null |
| `message` | `text` | Nullable |
| `photo_url` | `text` | Nullable |
| `status` | `text` | Default `"pending"` |
| `admin_notes` | `text` | Nullable |
| `created_at` | `timestamp` | Default `now()` |

#### `portfolio`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `title` | `text` | Not null |
| `description` | `text` | Not null |
| `category` | `text` | Not null |
| `before_image_urls` | `text[]` | Nullable array |
| `after_image_urls` | `text[]` | Not null array |
| `suburb` | `text` | Not null |
| `completed_date` | `text` | Nullable |
| `sort_order` | `integer` | Default `0` |
| `created_at` | `timestamp` | Default `now()` |

#### `reviews`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `customer_name` | `text` | Not null |
| `suburb` | `text` | Not null |
| `rating` | `integer` | Not null |
| `comment` | `text` | Not null |
| `service_type` | `text` | Not null |
| `status` | `text` | Default `"pending"` |
| `is_verified` | `boolean` | Default `false` |
| `created_at` | `timestamp` | Default `now()` |

#### `quotes`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `customer_name` | `text` | Not null |
| `customer_email` | `text` | Not null |
| `customer_phone` | `text` | Nullable |
| `suburb` | `text` | Not null |
| `job_type` | `text` | Not null |
| `description` | `text` | Not null |
| `switchboard_image_url` | `text` | Nullable |
| `fasci_image_url` | `text` | Nullable |
| `street_image_url` | `text` | Nullable |
| `preferred_date` | `text` | Nullable |
| `preferred_time` | `text` | Nullable |
| `status` | `text` | Default `"pending"` |
| `created_at` | `timestamp` | Default `now()` |

#### `jobs`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `customer_name` | `text` | Not null |
| `address` | `text` | Not null |
| `suburb` | `text` | Not null |
| `job_type` | `text` | Not null |
| `latitude` | `doublePrecision` | Not null |
| `longitude` | `doublePrecision` | Not null |
| `status` | `text` | Default `"pending"` |
| `priority` | `text` | Default `"normal"` |
| `estimated_duration` | `text` | Nullable |
| `total_amount` | `numeric(10,2)` | Nullable |
| `client_name` | `text` | Nullable |
| `client_phone` | `text` | Nullable |
| `client_email` | `text` | Nullable |
| `scheduled_date` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamp` | Default `now()` |

#### `customers`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `email` | `text` | Unique, not null |
| `name` | `text` | Not null |
| `phone` | `text` | Nullable |
| `suburb` | `text` | Nullable |
| `job_count` | `integer` | Default `0` |
| `last_job_date` | `text` | Nullable |
| `last_service_type` | `text` | Nullable |
| `marketing_notes` | `text` | Nullable |
| `tags` | `text` | Nullable (comma-separated string) |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

#### `conversations`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `title` | `text` | Not null |
| `created_at` | `timestamp with time zone` | Default `now()` |

#### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `conversation_id` | `integer` | FK → `conversations.id` ON DELETE CASCADE |
| `role` | `text` | `"user"` or `"assistant"` |
| `content` | `text` | Not null |
| `created_at` | `timestamp with time zone` | Default `now()` |

#### `media_items`
| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `title` | `text` | Not null |
| `filename` | `text` | Not null |
| `category` | `text` | Nullable |
| `tags` | `text[]` | Nullable array |
| `image_data` | `text` | Not null — full base64-encoded image data |
| `created_at` | `timestamp` | Default `now()` |

#### `settings`
| Column | Type | Notes |
|---|---|---|
| `key` | `text` | Primary key |
| `value` | `text` | Not null |
| `updated_at` | `timestamp with time zone` | Default `now()` |

Currently used key: `ai_system_prompt`

### Relationships

- `messages.conversation_id` → `conversations.id` (CASCADE DELETE) — the only declared foreign key
- `customers` are implicitly linked to `bookings` by matching `customer_email` (no FK constraint declared; joined in application code in `customers.ts`)
- All other tables are standalone (no FK relationships declared at the DB level)

---

## 6. Environment Variables

| Variable | Used By | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/db` | PostgreSQL connection string |
| `SESSION_SECRET` | `artifacts/api-server/src/app.ts` | Secret for signing express-session cookies — **required at startup** |
| `ADMIN_PASSWORD` | `artifacts/api-server/src/routes/admin-login.ts` | Plain-text admin password for the dashboard login |
| `PORT` | `artifacts/api-server/src/index.ts`, `artifacts/electrical-installers/vite.config.ts` | Port each service binds to — **required at startup** |
| `BASE_PATH` | `artifacts/electrical-installers/vite.config.ts` | Vite base path for the frontend (set to `/` by artifact.toml) — **required at startup** |
| `SMTP_HOST` | `artifacts/api-server/src/routes/bookings.ts`, `quotes.ts` | SMTP server hostname (defaults to `smtp.gmail.com` if absent) |
| `SMTP_PORT` | Same | SMTP port (defaults to `587`) |
| `SMTP_USER` | Same | SMTP username / sender address |
| `SMTP_PASS` | Same | SMTP password |
| `TWILIO_ACCOUNT_SID` | `artifacts/api-server/src/lib/sms.ts` | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Same | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Same | Twilio sender phone number (E.164 format) |
| `NODE_ENV` | Vite config, build scripts | Controls dev-only plugins (cartographer, dev banner) |
| `REPL_ID` | `artifacts/electrical-installers/vite.config.ts` | Enables Replit-specific Vite plugins when present |

SMTP and Twilio variables are all **optional** — their absence disables emails/SMS silently (best-effort). `DATABASE_URL`, `SESSION_SECRET`, `PORT`, and `BASE_PATH` are **required** and will throw at startup if absent.

---

## 7. Dependencies

### Frontend (`@workspace/electrical-installers`)

**All dependencies are `devDependencies` (static Vite build):**

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | 19.1.0 | UI framework |
| `vite` | ^7.3.3 | Build tool and dev server |
| `@vitejs/plugin-react` | ^5.2.0 | React Fast Refresh |
| `tailwindcss` | ^4.3.0 | Utility CSS |
| `@tailwindcss/vite` | ^4.3.0 | Tailwind Vite plugin |
| `@tailwindcss/typography` | ^0.5.19 | Prose styles |
| `wouter` | ^3.10.0 | Client-side routing |
| `@tanstack/react-query` | ^5.100.11 | Data fetching/caching |
| `@workspace/api-client-react` | workspace | Generated TanStack Query hooks |
| `@radix-ui/*` | various | Headless UI primitives (shadcn/ui) |
| `lucide-react` | ^0.545.0 | Icons |
| `react-icons` | ^5.6.0 | Additional icons |
| `framer-motion` | ^12.40.0 | Animation |
| `recharts` | ^2.15.4 | Dashboard bar charts |
| `react-hook-form` | ^7.76.0 | Form state management |
| `@hookform/resolvers` | ^3.10.0 | Zod integration for react-hook-form |
| `zod` | ^3.25.76 | Schema validation |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^3.6.0 | Merging Tailwind classes |
| `class-variance-authority` | ^0.7.1 | Component variant API |
| `sonner` | ^2.0.7 | Toast notifications |
| `date-fns` | ^3.6.0 | Date formatting |
| `react-day-picker` | ^9.14.0 | Calendar date picker |
| `cmdk` | ^1.1.1 | Command palette |
| `embla-carousel-react` | ^8.6.0 | Carousel |
| `input-otp` | ^1.4.2 | OTP input |
| `next-themes` | ^0.4.6 | Dark mode theme provider |
| `vaul` | ^1.1.2 | Drawer component |
| `react-resizable-panels` | ^2.1.9 | Resizable panel layout |
| `@replit/vite-plugin-runtime-error-modal` | ^0.0.6 | Dev error overlay |
| `@replit/vite-plugin-cartographer` | ^0.5.5 | Replit dev tooling |
| `@replit/vite-plugin-dev-banner` | ^0.1.2 | Replit dev tooling |

**Runtime `dependencies`:**

| Package | Version | Purpose |
|---|---|---|
| `leaflet` | ^1.9.4 | Map rendering |
| `react-leaflet` | ^5.0.0 | React wrapper for Leaflet |
| `@types/leaflet` | ^1.9.21 | Leaflet TypeScript types |
| `qrcode.react` | ^4.2.0 | QR code generation |
| `@workspace/integrations-openai-ai-react` | workspace | Audio playback hooks |

### Backend (`@workspace/api-server`)

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP server framework |
| `express-session` | ^1.19.0 | Session management |
| `cors` | ^2.8.6 | CORS middleware |
| `cookie-parser` | ^1.4.7 | Cookie parsing |
| `pino` | ^9.14.0 | Structured logging |
| `pino-http` | ^10.5.0 | HTTP request logging middleware |
| `drizzle-orm` | ^0.45.2 | PostgreSQL ORM |
| `nodemailer` | ^8.0.7 | SMTP email sending |
| `twilio` | ^6.0.2 | SMS via Twilio |
| `zod` | ^3.25.76 | Input validation |
| `@workspace/db` | workspace | DB client + schema |
| `@workspace/api-zod` | workspace | Generated Zod validation schemas |
| `@workspace/integrations-openai-ai-server` | workspace | OpenAI client via Replit proxy |
| `esbuild` | 0.27.3 | Production bundle |

### Potentially Unused or Noteworthy

- `cookie-parser` is listed as a dependency but `app.ts` does not call `app.use(cookieParser())` — express-session manages cookies directly. It appears unused.
- `tw-animate-css` (^1.4.0) is in frontend devDependencies; it provides CSS animation utilities for Tailwind but no custom animations appear to reference it directly — it may be a shadcn/ui scaffolding leftover.
- `@workspace/integrations-openai-ai-react` is in frontend dependencies — it provides audio hooks (`useAudioPlayback`, `useVoiceRecorder`, `useVoiceStream`) that are not currently wired into any visible UI component. The feature is present but unused in the frontend.
- `framer-motion` is installed; usage is likely limited to specific page transitions and animations.

---

## 8. Known Issues or TODOs

### TODO Comments Found in Code

- `artifacts/api-server/.replit-artifact/artifact.toml`, line 3: `previewPath = "/api" # TODO - should be excluded from preview in the first place` — the API server preview path is a placeholder that should ideally not be exposed as a user-facing preview.

### Hardcoded Values

- **Business phone number** `0419 868 703` is hardcoded in multiple places: `App.tsx` (sticky CTA), `ChatWidget.tsx`, `bookings.ts` email body, `quotes.ts` email body, and the AI system prompt in `ai-settings.ts`.
- **Business email** `info@electricalinstallers.com.au` is hardcoded as `BUSINESS_EMAIL` in both `bookings.ts` and `quotes.ts`.
- **Production admin URL** `https://electricalinstallers.com.au/admin/bookings` is hardcoded in the business notification email body in `bookings.ts` and `quotes.ts`.
- **OpenAI model** `gpt-4o-mini` and `max_completion_tokens: 512` are hardcoded in `openai.ts`.
- The AI system prompt default (a large multi-line string including the REC number and ABN) is hardcoded in `ai-settings.ts` as `DEFAULT_SYSTEM_PROMPT`.

### Incomplete Features / Observations

- **`customers.tags`** is stored as a plain `text` column (comma-separated string), not a proper `text[]` array. The frontend will need to split/join this field, which is inconsistent with `media_items.tags` which uses a proper `text[]` array.
- **No rate limiting** — the public endpoints (`POST /api/bookings`, `POST /api/quotes`, `POST /api/reviews`, and the entire `/api/openai/conversations` chain) have no rate limiting, making them susceptible to spam or abuse.
- **No pagination** — all list endpoints (`GET /api/bookings`, `GET /api/reviews`, etc.) return all rows without pagination, which could become slow at scale.
- **Media stored as base64 in DB** — `media_items.image_data` stores the full base64-encoded image directly in PostgreSQL. This is not suitable for large numbers of images and will degrade database performance; object storage would be preferable.
- **Voice/audio UI** — `@workspace/integrations-openai-ai-react` (with `useAudioPlayback`, `useVoiceRecorder`, `useVoiceStream`) is installed and built, but not connected to any frontend component.
- **`AdminLayout.tsx`** — referenced as a shared layout for admin pages; the individual admin page components import and use it, though `CalendarView` and `MediaLibrary` may not all consistently use the same sidebar structure.

---

## 9. Current Errors or Warnings

### Silent Error Swallowing

- **Email sending** in `bookings.ts` (`sendBookingEmails`) and `quotes.ts` (`sendQuoteEmails`) catches all errors with an empty `catch {}` block — failures are completely silent in logs. If SMTP is misconfigured, no error is surfaced.
- **SMS sending** in `sms.ts` catches all errors with `catch {}` — Twilio failures are silent.
- **Customer upsert** in `bookings.ts` (`upsertCustomer`) catches all errors silently — if the upsert fails (e.g. DB constraint), it goes unnoticed.
- **`ChatWidget.tsx`** catches conversation creation errors and stream errors but does not log them anywhere — failures surface only as a UI message to the user.
- **`MediaLibrary.tsx`, line 302**: `console.error("Failed to upload", file.name, err)` — the only `console.error` in the entire frontend codebase; this is the sole place where a client-side upload failure is logged.

### Potential Issues

- **`admin-login.ts`**: The password comparison `password !== adminPassword` is a plain string equality check with no constant-time comparison, making it theoretically susceptible to timing attacks (low risk in practice for a local admin panel).
- **`media.ts` `PATCH` handler**: The body fields `title`, `category`, `tags` are typed with a plain `as { ... }` cast rather than being parsed through a Zod schema — missing input validation on this endpoint.
- **`customers.ts` `PATCH` handler**: Same pattern — `marketingNotes` and `tags` from `req.body` are cast without Zod validation.
- **`openai.ts`**: No authentication is required to create conversations or send messages to the AI. Any visitor can create unlimited conversations and accumulate OpenAI API costs. There is no per-session or per-IP limit.
- **Express 5 async error propagation**: Most route handlers correctly call `next(err)` in catch blocks, so unhandled errors reach the global error handler. However, `openai.ts` routes do **not** call `next` — they handle errors inline and write to the SSE stream, which means OpenAI errors bypass the global error handler.

---

## 10. Security

### Potential Concerns

| Area | Issue | Severity |
|---|---|---|
| **CORS** | `app.ts` uses `cors()` with no options — this allows all origins. Suitable for a public API but means any external site can make credentialed-style requests. | Low |
| **Admin password** | `ADMIN_PASSWORD` is a single shared plain-text password with no hashing, account lockout, or brute-force protection. No rate limiting on `POST /api/admin/login`. | Medium |
| **Session cookie** | `sameSite: "lax"` and `httpOnly: true` are set, but `secure: true` is **not** set in `app.ts`. In production over HTTPS this may be handled by the proxy, but it is not enforced at the Express level. | Low–Medium |
| **Public AI endpoints** | `POST /api/openai/conversations` and `POST /api/openai/conversations/:id/messages` require no authentication. Any visitor can drive up OpenAI API usage. | Medium |
| **Input validation gaps** | `PATCH /api/admin/media/:id` and `PATCH /api/admin/customers/:id` read fields from `req.body` without Zod validation. | Low |
| **Public review submission** | `POST /api/reviews` is unauthenticated and unrated — anyone can submit reviews. Mitigated by the pending/approved moderation flow, but spam reviews will accumulate. | Low |
| **Media stored as base64** | Full image data in `image_data` column; no file-type validation on upload — the `imageData` field is accepted as-is, so arbitrary text could be stored. | Low |
| **Hardcoded secrets in source** | No secrets are hardcoded in the source. The business phone/email are hardcoded as constants, which is not a security issue but means changes require code updates. | None |
| **SQL injection** | Not a concern — all DB access goes through Drizzle ORM parameterised queries. | None |
| **XSS in emails** | Email HTML in `bookings.ts` and `quotes.ts` uses a manual `esc()` function to HTML-escape all user-supplied values before interpolation. This is correct, though a dedicated library would be more robust. | Low |
| **No `helmet`** | The Express app does not use `helmet` for security headers (no `Content-Security-Policy`, `X-Frame-Options`, etc.). These may be provided by the Replit proxy in production. | Low |
