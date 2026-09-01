---
name: Prerender crawlable links
description: Why crawler-critical navigation must be emitted by the static prerender shell.
---

The SEO prerender process writes hand-built content into the app root rather than rendering the React component tree. Every generated page must therefore receive plain-anchor main navigation and service-area links from the prerender shell itself.

**Why:** Links that exist only in React components are absent from raw HTML and may not be discovered during a crawler's first non-JavaScript pass.

**How to apply:** When adding or changing public routes or suburb pages, keep the shared prerender navigation/footer link sources aligned and verify raw generated HTML for the homepage, service-area hub, and a suburb page.