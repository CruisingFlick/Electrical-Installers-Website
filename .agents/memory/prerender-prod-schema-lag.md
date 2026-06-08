---
name: Prerender must tolerate prod schema lag
description: Why the SEO prerender (build step) must degrade gracefully on DB errors instead of process.exit(1), and how Replit publish-time schema migration ordering causes build-time "column does not exist" failures.
---

# Prerender / build-time DB queries vs production schema lag

The production build for `electrical-installers` runs `vite build && @workspace/scripts prerender`. The prerender queries the database at build time to generate SEO HTML for dynamic routes (blog, service pages, suburb pages, faqs).

**Rule:** the prerender must NOT hard-fail (`process.exit(1)`) when `DATABASE_URL` is missing or a query errors. It must warn-and-continue, prerendering static + listing routes always and each dynamic collection only if its query succeeds (per-query `.catch`). Skipped routes still render client-side at runtime and get prerendered on the next publish.

**Why:** Replit applies the publish-time schema diff to the production database **after the build runs**, not before. So on the release that introduces a new column, the build's prerender queries production while it still has the OLD schema → Postgres `42703 column "X" does not exist` → the whole deployment fails. This is a normal, expected transitional state, not a bug to fix by forcing schema into prod. (A change that made prerender `process.exit(1)` on any DB error turned this transient lag into a hard publish failure.)

**How to apply:**
- Keep `loadDynamicData()` in `scripts/src/prerender.ts` resilient. Never reintroduce a hard exit on missing `DATABASE_URL` or query failure.
- Adding columns rolls out across TWO publishes: publish 1 builds (prerender skips the new-column table, succeeds), then publish applies the schema diff to prod; publish 2 prerenders the table fully. This two-publish rollout is also how the base tables originally reached prod.
- Do NOT "fix" a prod `column does not exist` by pushing schema to prod manually, adding `db:push` to the deploy build, or adding startup DDL. Production schema is owned by the Publish flow (see `.local/skills/database` references). The correct user action is: re-publish.
