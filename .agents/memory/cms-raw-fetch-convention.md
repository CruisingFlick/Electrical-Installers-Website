---
name: CMS feature routes use raw fetch
description: Why newer CMS/admin feature routes skip OpenAPI/Orval codegen and use local Zod + raw fetch instead.
---

The newer feature routes — FAQ (`/faqs`), Pricing (`/pricing`), Service Pages (`/service-pages`), Suburb Pages (`/suburb-pages`), and Google Reviews (`/google-reviews`) — intentionally use **local Zod schemas server-side + raw `fetch` client-side** (via `src/lib/cms.ts` helpers `apiGet`/`apiSend`, and TanStack `useQuery`). They are NOT in `openapi.yaml` and have no Orval-generated hooks.

**Why:** This matches the pre-existing `blog` and `settings` routes, avoids codegen churn for simple CRUD, and keeps these admin-only/CMS features decoupled from the spec-first contract used by the core public booking/quote/review flows. A code review will flag this as "OpenAPI/Orval drift" — that flag is expected and acceptable, not a bug to fix.

**How to apply:** When adding another simple CMS/admin entity, follow the same pattern (own public + admin Express router with `requireAdmin`, local Zod, `cms.ts` on the client). Only edit `openapi.yaml` + regenerate when touching the core contract types (e.g. booking status enum) that already live in the spec.
