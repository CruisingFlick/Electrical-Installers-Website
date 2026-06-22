---
name: drizzle-orm peer-variant duplication after dep changes
description: Why adding/removing an api-server dependency can trigger phantom TS2769 drizzle type errors, and the fix.
---

Changing api-server's dependency set (e.g. `pnpm remove twilio nodemailer`) can make pnpm re-resolve its `drizzle-orm` (specifier `catalog:`) from the `0.45.2(@types/pg)(pg)` peer variant to the bare `0.45.2` variant. `@workspace/db` always resolves the pg-peer variant, so the two now have **distinct nominal types** → typecheck explodes with TS2769 "No overload matches this call" / "Property 'config' is protected" / "separate declarations of a private property 'shouldInlineParams'" on ordinary drizzle query code (e.g. `eq(threads.id, ...)`) that you never touched.

**Why:** drizzle-orm has optional peer deps on `pg`/`@types/pg`; pnpm keys a separate package instance per peer set. api-server doesn't depend on pg directly, so its variant is only kept aligned with `@workspace/db` by pnpm's dedupe heuristic — which can flip when the dependency graph changes.

**How to apply:** if drizzle type errors appear right after an unrelated dependency add/remove in an artifact that consumes `@workspace/db`, don't chase the reported line. Run `pnpm dedupe` (and `pnpm run typecheck:libs` to refresh composite lib declarations) to realign onto the single pg-peer variant. The web frontend legitimately keeps a bare `drizzle-orm@0.45.2` — that one is fine.
