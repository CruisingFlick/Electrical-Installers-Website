---
name: Booking soft-delete consistency
description: All the places a soft-deleted booking must be filtered, and the one place it must still appear.
---

Bookings are soft-deleted (`deletedAt` + `deletionReason` on the bookings table), never hard-deleted. The admin DELETE handler sets these fields and preserves the customer (upsert WITHOUT incrementing jobCount).

**Rule:** a soft-deleted booking must be excluded from EVERY active-booking path, and must NOT be mutable, but must STILL appear in customer job history.

**Why:** the customer's contact + the fact/reason of deletion is durable business record; treating a deleted row as active causes phantom emails/SMS, wrong analytics, and inflated jobCount.

**How to apply — exclude `deletedAt IS NULL` in:**
- `GET /bookings` (admin list), `GET /bookings/export`
- `GET /bookings/track` (public — 404 if `row.deletedAt`)
- analytics.ts (all counts/groupings)
- booking mutation endpoints: `POST /:id/confirm`, `PATCH /:id` (status), `PATCH /:id/notes` — add `isNull(deletedAt)` to the update WHERE so a deleted row returns 404 (prevents stray status emails/SMS)
- `POST /admin/customers/sync` — filter the source bookings query so deleted jobs don't re-inflate jobCount

**Must STILL show deleted rows:** `GET /admin/customers/:id` job history (UI renders a "Deleted" badge + reason). Do not filter here.
