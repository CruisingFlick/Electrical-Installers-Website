# Electrical Installers — Website Audit Report

**URL:** https://www.electricalinstallers.com.au  
**Date:** 2026-06-15  
**Stack:** TypeScript · React · Express  
**Pages found in sitemap:** 24  

---

## Priority Summary

| # | Area | Issue | Severity |
|---|------|-------|----------|
| 1 | Empty pages | 6 pages in sitemap have no content | **High** |
| 2 | SEO | React SPA has no server-side rendering — Google can't read page content | **High** |
| 3 | SEO | No structured data (LocalBusiness schema) — hurts local Google ranking | **High** |
| 4 | Contact | No email address anywhere on the site | **Medium** |
| 5 | Images | No images on any page — no alt text detected | **Medium** |
| 6 | Privacy | Privacy policy page not displaying content | **Medium** |
| 7 | Security | `/messages` page is publicly listed in sitemap | **Medium** |
| 8 | Accessibility | No images means no alt text — fails basic accessibility | **Medium** |
| 9 | SEO | All pages share the same title and meta description | **Medium** |
| 10 | Location pages | 8 location pages exist but may lack unique content | **Low** |

---

## Issue 1 — Empty / Stub Pages (HIGH)

The following pages are listed in the sitemap with priority rankings but contain no visible content — they render the same homepage wrapper with no page-specific text, forms, or data.

| Page | Expected Content | Current State |
|------|-----------------|---------------|
| `/pricing` | Service pricing tiers or call-for-quote info | Empty |
| `/faq` | Frequently asked questions and answers | Empty |
| `/reviews` | Customer reviews and star ratings | Empty |
| `/portfolio` | Photos and descriptions of completed jobs | Empty |
| `/blog` | Articles and posts | Empty |
| `/track` | Job tracking form for customers | Empty |

**Impact:** Visitors clicking these links from Google or the site nav will land on blank pages and immediately leave. Google will also penalise pages with no content.

### Fix for each page

**`/pricing`** — Add at minimum a "call for a quote" section with the phone number, or a table showing rough price ranges for common jobs (powerpoint installation, switchboard upgrade, underground power). Even a simple message is better than blank.

**`/faq`** — Add 6–10 common questions. Suggested content:
- Do you service [suburb]?
- Are you licensed? (Yes — REC 25510)
- Do you provide free quotes?
- How long does underground power take?
- Can you handle three-phase power for my workshop?
- What areas do you cover?

**`/reviews`** — Pull in Google reviews via the Google Places API, or paste in 3–5 real reviews manually as static content.

**`/portfolio`** — Add 3–6 before/after photos of completed jobs with a short description (job type, suburb, what was done).

**`/blog`** — Add at least 2–3 articles. Suggested topics:
- "What's involved in underground power on the Mornington Peninsula?"
- "When do you need a three-phase power upgrade?"
- "Shed wiring checklist — what your electrician needs to know"

**`/track`** — Either build the tracking form or remove the page from the sitemap until it's ready.

---

## Issue 2 — React SPA Has No Server-Side Rendering (HIGH)

### The Problem

Every page on the site returns the same HTML shell with no page-specific content in the source. Google's crawler reads the raw HTML — it does not execute JavaScript. This means:

- Every page looks identical to Google
- Page-specific titles and descriptions are not indexed
- Interior pages (`/pricing`, `/faq`, `/services`) cannot rank individually in search results

### The Fix

Implement **server-side rendering (SSR)** or **static site generation (SSG)** so that each page's content is included in the HTML that Google receives.

**Option A — Switch to Next.js (Recommended)**  
Next.js is a React framework with built-in SSR/SSG. It runs on top of your existing React components with minimal changes:
```
npm install next
```
Each page becomes a file in the `/app` or `/pages` directory. Static pages use `getStaticProps`, dynamic ones use `getServerSideProps`.

**Option B — Add prerendering with `react-snap` or `vite-plugin-ssr`**  
If a full Next.js migration is too large right now, add prerendering as a build step:
```
npm install react-snap
```
Add to `package.json`:
```json
"postbuild": "react-snap"
```
This generates static HTML snapshots of each route at build time.

**Option C — Add Open Graph and title tags per page**  
At minimum, ensure each page sets its own `<title>` and `<meta name="description">` using `react-helmet` or `react-helmet-async`:
```
npm install react-helmet-async
```
Example for the `/services` page:
```tsx
<Helmet>
  <title>Electrical Services — Mornington Peninsula | Electrical Installers</title>
  <meta name="description" content="Licensed electricians serving Mornington Peninsula. New homes, commercial, 3-phase, underground power. REC 25510. Call 0419 868 703." />
</Helmet>
```

---

## Issue 3 — No Structured Data / LocalBusiness Schema (HIGH)

### The Problem

Google uses structured data to show your business in the local map pack, display star ratings, show your phone number directly in search results, and understand your service area. Without it, you're invisible in local search compared to competitors who have it.

### The Fix

Add this JSON-LD script to the `<head>` of every page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ElectricalContractor",
  "name": "Electrical Installers",
  "description": "Licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne with 35 years of experience.",
  "url": "https://www.electricalinstallers.com.au",
  "telephone": "+61419868703",
  "license": "REC 25510",
  "areaServed": [
    "Mornington Peninsula",
    "Frankston",
    "Mount Eliza",
    "Mornington",
    "Rosebud",
    "Rye",
    "Sorrento",
    "Portsea",
    "St Kilda",
    "Warragul",
    "Bayside"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Electrical Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "New Homes & Renovations" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial & Industrial" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "3-Phase Power Upgrades" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Sheds & Garages" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Underground Power" } }
    ]
  },
  "sameAs": []
}
</script>
```

Add your physical address and Google Business Profile URL to `sameAs` once available.

---

## Issue 4 — No Email Address (MEDIUM)

### The Problem

The only contact method visible on the site is the phone number `0419 868 703`. There is no email address on the contact page, homepage, or footer. Many potential customers (especially those browsing on desktop) prefer email over calling.

### The Fix

Add a contact email to:
- The homepage footer
- The contact page
- The booking/quote page

If you don't want to expose a real email to spam bots, use a contact form that submits via the Express backend instead of displaying the email directly:

```tsx
// Contact form that POSTs to your Express API
<form onSubmit={handleSubmit}>
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Your email" required />
  <input name="phone" placeholder="Phone number" />
  <textarea name="message" placeholder="What do you need?" required />
  <button type="submit">Send Message</button>
</form>
```

Express endpoint:
```ts
router.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  // send email via nodemailer or Resend API
  res.json({ ok: true });
});
```

---

## Issue 5 — No Images on Any Page (MEDIUM)

### The Problem

No images were detected on any page — homepage, services, portfolio, or location pages. A trade services site without photos appears untrustworthy to visitors. Photos of real completed work also significantly improve conversion rates.

### The Fix

**Homepage:** Add a hero image (a completed job — underground power cable trench, a clean switchboard install, a residential fit-out).

**Services pages:** Add one photo per service type.

**Portfolio page:** This is the most important — 4–8 before/after photos of real jobs with suburb and job type labelled.

**All images must have descriptive alt text for accessibility and SEO:**
```html
<img src="/images/underground-power-mornington.jpg" 
     alt="Underground power installation completed in Mornington, Mornington Peninsula" />
```

---

## Issue 6 — Privacy Policy Page Not Rendering (MEDIUM)

### The Problem

The `/privacy-policy` page is in the sitemap but the content is not being served — it returns the homepage shell with no policy text. This is a legal requirement in Australia under the Privacy Act 1988 if you collect any personal data (booking forms, contact forms, email addresses).

### The Fix

Either:
- Add the privacy policy text as static content in the React component for that route, **or**
- Store it in your database and serve it via an Express API endpoint

The policy must cover at minimum: what data you collect, how it's used, how it's stored, and how users can request deletion.

---

## Issue 7 — `/messages` Page Publicly Listed in Sitemap (MEDIUM)

### The Problem

The sitemap includes a `/messages` page at priority 0.5. If this is an internal admin or customer messaging page, it should not be indexed by Google or accessible without authentication.

### The Fix

**Option A — Require login to access it:**
```ts
router.get('/messages', requireAuth, (req, res) => {
  // only logged-in users reach this
});
```

**Option B — Remove it from the sitemap if it's admin-only:**
```xml
<!-- Remove this line from sitemap.xml -->
<url><loc>https://www.electricalinstallers.com.au/messages</loc></url>
```

**Option C — Block it in robots.txt:**
```
Disallow: /messages
```

---

## Issue 8 — All Pages Share the Same Title (MEDIUM)

Every page currently returns the same `<title>` tag. This means:
- Google shows the same title for every page in search results
- Users can't tell which tab is which
- Interior pages can't rank for their own keywords

### The Fix

Each page needs a unique title and meta description. Examples:

| Page | Title | Meta Description |
|------|-------|-----------------|
| Home | `Electrical Installers — Mornington Peninsula \| REC 25510` | `Licensed electricians on the Mornington Peninsula. 35 years experience. New homes, 3-phase, underground power. Call 0419 868 703.` |
| Services | `Electrical Services — New Homes, Commercial & Underground Power` | `Full electrical services for residential and commercial clients across Mornington Peninsula and Bayside.` |
| Underground Power | `Underground Power Installation — Mornington Peninsula` | `Complete United Energy 5-step underground power management. Licensed electricians. Call 0419 868 703.` |
| Book | `Book an Electrician — Mornington Peninsula` | `Request an appointment with licensed electricians serving Mornington Peninsula, Frankston, and Warragul.` |
| FAQ | `FAQs — Electrical Installers Mornington Peninsula` | `Common questions about our electrical services, licensing, and service areas.` |

---

## Issue 9 — Location Pages May Lack Unique Content (LOW)

The sitemap lists 8 location-specific pages (Mornington, Mount Eliza, Frankston, Dromana, Rosebud, Rye, Sorrento, Hastings). If each of these pages shows identical content with just the suburb name swapped, Google will treat them as duplicate content and penalise the site.

### The Fix

Each location page needs at least 2–3 sentences of unique content specific to that area:
- Mention local landmarks or common job types in that suburb
- Note any area-specific requirements (e.g. underground power is common in certain Mornington Peninsula areas due to council requirements)
- Add a suburb-specific FAQ question

Example for Sorrento:
> "We regularly work in Sorrento and Portsea, where underground power is often required for new beachside builds and holiday home renovations. Our team is familiar with the local council requirements and United Energy's process for these areas."

---

## Fix Priority Order for Replit

1. **Add content to the 6 empty pages** — most visible impact for visitors
2. **Add unique `<title>` and `<meta description>` to every page** — quick win for SEO
3. **Add LocalBusiness structured data** — copy-paste the JSON-LD above into the `<head>`
4. **Add email / contact form** — recovers customers who won't call
5. **Add images** — especially to homepage and portfolio
6. **Fix privacy policy page** — legal requirement
7. **Protect or remove `/messages` from sitemap**
8. **Make location pages unique** — longer-term SEO improvement
9. **Implement SSR/Next.js** — larger project, biggest long-term SEO gain

---

## What's Working Well

- Phone number is prominent and clickable (`tel:` link) ✓
- "Book an Appointment" CTA is consistent across pages ✓
- License number (REC 25510) is displayed — builds trust ✓
- Service areas are clearly listed ✓
- `/admin` is blocked in robots.txt ✓
- Sitemap exists and is referenced in robots.txt ✓
- HTTPS is active ✓
