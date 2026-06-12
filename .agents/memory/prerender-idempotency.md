---
name: Prerender not idempotent
description: Why re-running the prerender script manually corrupts dist output for all routes
---

The SEO prerender script reads the built `dist/public/index.html` once as `baseHtml`, then injects per-route `bodyHtml` by replacing the literal `<div id="root"></div>`.

**Rule:** Only ever run prerender against a FRESH `vite build` output. The artifact `build` script already chains `vite build && prerender`, so prerender runs exactly once on a clean index.html.

**Why:** The `/` (home) route writes its injected body back into `index.html` itself. If you run prerender a second time on that same dist, `baseHtml` now contains the home page's content inside `#root`, so the `<div id="root"></div>` replace no longer matches — every route silently inherits the stale HOME page body (wrong H1/content) while still getting correct head tags. Symptom: suburb/page files show the home H1 ("Mornington Peninsula's Electrical Specialists") instead of their own.

**How to apply:** To re-verify prerender output, always `rm -rf dist` and run the full `build` (not a bare second `prerender`). Never trust a dist produced by two prerender passes.
