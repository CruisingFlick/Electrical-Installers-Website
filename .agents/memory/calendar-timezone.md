---
name: Calendar event timezone
description: How calendar (ICS / Google Calendar) events must handle timezone for this Melbourne-based business.
---

All calendar events (ICS files, Google Calendar links, email .ics attachments) must represent **Australia/Melbourne** wall-clock time, then convert to UTC for output.

**Why:** Booking dates/times are stored as human strings (e.g. "15 June 2026 at 9:00 AM") representing Melbourne business hours. Naively doing `new Date(...).setHours(...)` interprets them in the runtime's local timezone — fine in an AU browser, but the API server host is UTC, so emailed appointment .ics files would be shifted hours off (e.g. 9 AM shown as 7 PM).

**How to apply:** Use the `wallClockToUtc(y, mo, d, h, mi, "Australia/Melbourne")` pattern (computes the zone offset at that instant via `Intl.DateTimeFormat` `formatToParts`, subtracts it from the UTC guess). Frontend helper is exported as `melbourneWallClockToUtc` in `src/lib/calendar.ts`; the API server has its own copy in `routes/bookings.ts`. This correctly handles AEST (+10) vs AEDT (+11) daylight saving. Verified: June 9 AM → prior-day 23:00Z, January 9 AM → prior-day 22:00Z.
