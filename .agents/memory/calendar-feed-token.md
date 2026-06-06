---
name: Calendar feed subscribe token
description: Why the auto-sync ICS calendar feed token is persisted in the DB settings table, not derived from a secret.
---

The owner-facing "auto-sync calendar" feature exposes a public, token-gated ICS feed (`/api/calendar/feed.ics?token=...`) that calendar apps poll. The owner subscribes to that URL **once**, so the token must be permanently stable.

**Rule:** Generate the feed token once and persist it in the `settings` key-value table (key `calendarFeedToken`). An explicit `CALENDAR_FEED_TOKEN` env var, if set, overrides it.

**Why:** An earlier version derived the token via HMAC(SESSION_SECRET, ...). That silently breaks every existing subscription whenever SESSION_SECRET is rotated or the environment is rebuilt — directly violating the "subscribe once" promise. Coupling a long-lived public URL to a rotatable secret is the trap to avoid.

**How to apply:** Any long-lived, externally-bookmarked capability URL (calendar feeds, unsubscribe links, share links) needs a token whose lifetime is independent of session/auth secrets — persist it, don't derive it. Compare provided vs expected tokens with `timingSafeEqual` after a length check.
