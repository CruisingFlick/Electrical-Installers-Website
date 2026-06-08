import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = "https://www.electricalinstallers.com.au";
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.png`;

const DIST_DIR = path.resolve(
  import.meta.dirname,
  "../../artifacts/electrical-installers/dist/public",
);
const INDEX_HTML = path.join(DIST_DIR, "index.html");

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function injectMeta(
  html: string,
  opts: {
    title: string;
    description: string;
    canonicalPath: string;
    ogImage?: string;
    ogType?: string;
    bodyHtml?: string;
  },
): string {
  const {
    title,
    description,
    canonicalPath,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    bodyHtml,
  } = opts;

  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const safeTitle = escapeAttr(title);
  const safeDesc = escapeAttr(truncate(description, 160));
  const safeImage = escapeAttr(ogImage);

  let result = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${safeTitle}</title>`,
  );

  result = result.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${safeDesc}" />`,
  );

  // Strip any existing canonical, og:*, and twitter:* tags to avoid duplicates
  // (the base index.html contains defaults; each route gets its own below)
  result = result.replace(/[ \t]*<link rel="canonical"[^>]*>\n?/g, "");
  result = result.replace(/[ \t]*<meta property="og:[^"]*"[^>]*>\n?/g, "");
  result = result.replace(/[ \t]*<meta name="twitter:[^"]*"[^>]*>\n?/g, "");

  const seoTags = [
    `  <link rel="canonical" href="${canonicalUrl}" />`,
    `  <meta property="og:title" content="${safeTitle}" />`,
    `  <meta property="og:description" content="${safeDesc}" />`,
    `  <meta property="og:url" content="${canonicalUrl}" />`,
    `  <meta property="og:image" content="${safeImage}" />`,
    `  <meta property="og:type" content="${ogType}" />`,
    `  <meta property="og:site_name" content="Electrical Installers" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${safeTitle}" />`,
    `  <meta name="twitter:description" content="${safeDesc}" />`,
    `  <meta name="twitter:image" content="${safeImage}" />`,
  ].join("\n");

  result = result.replace("</head>", `${seoTags}\n</head>`);

  if (bodyHtml) {
    // Inject static HTML into #root. Since the app uses createRoot().render()
    // (not hydrateRoot()), React will replace this content on mount with no
    // hydration errors. Crawlers and social bots that don't execute JS will
    // see the full page content immediately.
    result = result.replace(
      '<div id="root"></div>',
      `<div id="root">${bodyHtml}</div>`,
    );
  }

  return result;
}

function writeRoute(routePath: string, html: string): void {
  const filePath =
    routePath === "/"
      ? path.join(DIST_DIR, "index.html")
      : path.join(DIST_DIR, routePath.replace(/^\//, ""), "index.html");

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, html, "utf-8");
  process.stdout.write(`  ✓ ${routePath}\n`);
}

// ---------------------------------------------------------------------------
// Static HTML body renderers — produce crawlable content for each page type.
// React replaces this on mount (createRoot.render), so it's safe to inject.
// ---------------------------------------------------------------------------

type BlogPostRow = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string | null;
  publishedAt: Date | null;
};

type ServicePageRow = {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  bullets: string[];
  pricingBlurb: string | null;
  portfolioCategory: string | null;
  heroImageUrl: string | null;
};

type SuburbPageRow = {
  slug: string;
  suburb: string;
  heading: string;
  intro: string;
  servicesCopy: string | null;
  recentProjects: string | null;
  localTestimonial: string | null;
  localTestimonialAuthor: string | null;
  nearbyAreas: string | null;
  localFaqs: string | null;
};

function renderBlogListBody(posts: BlogPostRow[]): string {
  const style = "font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<h1>Electrical Tips &amp; Guides</h1>`;
  html += `<p>Practical advice from our licensed electricians — helping you understand your home&#39;s electrical system, stay safe, and get the most from your electrical investment on the Mornington Peninsula.</p>`;
  if (posts.length > 0) {
    html += `<ul style="list-style:none;padding:0;display:grid;gap:1.5rem;">`;
    for (const p of posts) {
      const dateStr = p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
        : "";
      html += `<li style="border:1px solid #e5e7eb;border-radius:0.75rem;padding:1.25rem;">`;
      html += `<a href="/blog/${escapeAttr(p.slug)}" style="color:#1e3a5f;font-weight:700;font-size:1.1rem;">${escapeHtml(p.title)}</a>`;
      if (p.category) html += ` <span style="margin-left:0.5rem;font-size:0.8rem;color:#ea6c00;text-transform:capitalize;">${escapeHtml(p.category)}</span>`;
      if (dateStr) html += `<br><small style="color:#6b7280;">${escapeHtml(dateStr)}</small>`;
      html += `<p style="color:#374151;margin:0.5rem 0 0;">${escapeHtml(truncate(p.excerpt, 200))}</p>`;
      html += `</li>`;
    }
    html += `</ul>`;
  }
  html += `</div>`;
  return html;
}

function renderServicesListBody(cmsPages: ServicePageRow[]): string {
  const style = "font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<h1>Our Electrical Services</h1>`;
  html += `<p>Complete electrical services for residential and commercial properties across the Mornington Peninsula, Bayside, and South East Melbourne. New home wiring, renovations, switchboard upgrades, underground power, 3-phase industrial work, and safety inspections.</p>`;

  const coreServices = [
    { title: "New Homes &amp; Renovations", desc: "Full wiring for new builds and renovations. Solar-ready switchboards, safety switches, smoke alarms, and data cabling." },
    { title: "Commercial &amp; Industrial", desc: "Factory fit-outs, machinery wiring, emergency lighting systems, switchboard design, and compliance audits." },
    { title: "3-Phase Power Upgrades", desc: "Load assessment, switchboard design, meter reconfiguration, equipment connection, and compliance certification." },
    { title: "Sheds &amp; Garages", desc: "Single and 3-phase power, LED lighting, safety switches, power points, and sub-board installation." },
    { title: "Underground Power", desc: "Full United Energy 5-step process management — inspection, application, trenching, cabling, and final connection." },
  ];

  html += `<ul style="list-style:none;padding:0;display:grid;gap:1rem;">`;
  for (const s of coreServices) {
    html += `<li style="border:1px solid #e5e7eb;border-radius:0.75rem;padding:1rem;">`;
    html += `<strong style="color:#1e3a5f;">${s.title}</strong>`;
    html += `<p style="color:#374151;margin:0.5rem 0 0;">${s.desc}</p>`;
    html += `</li>`;
  }

  if (cmsPages.length > 0) {
    for (const p of cmsPages) {
      html += `<li style="border:1px solid #e5e7eb;border-radius:0.75rem;padding:1rem;">`;
      html += `<a href="/services/${escapeAttr(p.slug)}" style="color:#1e3a5f;font-weight:700;">${escapeHtml(p.title)}</a>`;
      html += `<p style="color:#374151;margin:0.5rem 0 0;">${escapeHtml(truncate(p.shortDescription, 200))}</p>`;
      html += `</li>`;
    }
  }
  html += `</ul>`;
  html += `</div>`;
  return html;
}

function renderSuburbListBody(suburbPages: SuburbPageRow[]): string {
  const style = "font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<h1>Our Service Areas</h1>`;
  html += `<p>We serve residential and commercial customers across the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding areas of South East Melbourne with professional electrical services.</p>`;
  if (suburbPages.length > 0) {
    html += `<ul style="list-style:none;padding:0;display:grid;gap:0.75rem;">`;
    for (const p of suburbPages) {
      html += `<li><a href="/${escapeAttr(p.slug)}" style="color:#1e3a5f;font-weight:600;">${escapeHtml(p.suburb)}</a>`;
      html += ` — ${escapeHtml(truncate(p.intro, 120))}</li>`;
    }
    html += `</ul>`;
  }
  html += `</div>`;
  return html;
}

function renderBlogPostBody(post: BlogPostRow): string {
  const style = "font-family:sans-serif;max-width:720px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<nav><a href="/blog" style="color:#ea6c00;">← All articles</a></nav>`;
  if (post.category) {
    html += `<p style="color:#ea6c00;font-weight:600;text-transform:capitalize;margin:1rem 0 0.25rem;">${escapeHtml(post.category)}</p>`;
  }
  if (post.publishedAt) {
    const dateStr = new Date(post.publishedAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    html += `<p style="color:#6b7280;font-size:0.9rem;margin:0 0 0.5rem;">${escapeHtml(dateStr)}</p>`;
  }
  html += `<h1 style="color:#1e3a5f;">${escapeHtml(post.title)}</h1>`;
  html += `<p style="font-size:1.1rem;color:#4b5563;border-left:4px solid #ea6c00;padding-left:1rem;margin:1rem 0;">${escapeHtml(post.excerpt)}</p>`;
  html += `<div style="color:#374151;line-height:1.8;white-space:pre-wrap;">${escapeHtml(post.content)}</div>`;
  html += `<div style="margin-top:2rem;background:#1e3a5f;color:#fff;border-radius:1rem;padding:2rem;text-align:center;">`;
  html += `<h3>Got electrical questions?</h3>`;
  html += `<p>We&#39;re happy to chat through your project — no obligation.</p>`;
  html += `<a href="tel:0419868703" style="color:#ea6c00;font-weight:600;">Call 0419 868 703</a> &nbsp;|&nbsp; <a href="/book" style="color:#fff;">Book an Appointment</a>`;
  html += `</div>`;
  html += `</div>`;
  return html;
}

function renderServicePageBody(page: ServicePageRow): string {
  const style = "font-family:sans-serif;max-width:720px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<nav><a href="/services" style="color:#ea6c00;">← All services</a></nav>`;
  html += `<h1 style="color:#1e3a5f;margin-top:1rem;">${escapeHtml(page.title)}</h1>`;
  html += `<p style="font-size:1.1rem;color:#4b5563;border-left:4px solid #ea6c00;padding-left:1rem;margin:1rem 0;">${escapeHtml(page.shortDescription)}</p>`;
  html += `<div style="color:#374151;line-height:1.8;white-space:pre-wrap;">${escapeHtml(page.fullDescription)}</div>`;
  if (page.bullets.length > 0) {
    html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">What&#39;s included</h2><ul style="color:#374151;line-height:1.8;">`;
    for (const b of page.bullets) {
      html += `<li>${escapeHtml(b)}</li>`;
    }
    html += `</ul>`;
  }
  if (page.pricingBlurb) {
    html += `<p style="background:#fffbeb;border:1px solid #fcd34d;border-radius:0.5rem;padding:1rem;color:#92400e;">${escapeHtml(page.pricingBlurb)}</p>`;
  }
  html += `<div style="margin-top:2rem;background:#1e3a5f;color:#fff;border-radius:1rem;padding:2rem;text-align:center;">`;
  html += `<h3>Ready to get started?</h3>`;
  html += `<p>Book a job or request a free quote today.</p>`;
  html += `<a href="/book" style="color:#ea6c00;font-weight:600;">Book Now</a> &nbsp;|&nbsp; <a href="tel:0419868703" style="color:#fff;">Call 0419 868 703</a>`;
  html += `</div>`;
  html += `</div>`;
  return html;
}

function parseLocalFaqs(text: string): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  const blocks = text.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const qLine = lines.find((l) => l.startsWith("Q:"));
    const aLine = lines.find((l) => l.startsWith("A:"));
    if (qLine && aLine) {
      faqs.push({ q: qLine.slice(2).trim(), a: aLine.slice(2).trim() });
    }
  }
  return faqs;
}

function renderSuburbPageBody(page: SuburbPageRow): string {
  const style = "font-family:sans-serif;max-width:840px;margin:0 auto;padding:2rem 1rem;";
  let html = `<div style="${style}">`;
  html += `<p style="color:#ea6c00;font-weight:600;">📍 ${escapeHtml(page.suburb)}</p>`;
  html += `<h1 style="color:#1e3a5f;">${escapeHtml(page.heading)}</h1>`;
  html += `<div style="color:#374151;line-height:1.8;white-space:pre-wrap;">${escapeHtml(page.intro)}</div>`;

  if (page.servicesCopy) {
    html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">Services we offer in ${escapeHtml(page.suburb)}</h2>`;
    html += `<div style="color:#374151;line-height:1.8;white-space:pre-wrap;">${escapeHtml(page.servicesCopy)}</div>`;
  } else {
    html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">Services we offer in ${escapeHtml(page.suburb)}</h2>`;
    html += `<ul style="color:#374151;line-height:1.8;">`;
    for (const s of ["New homes &amp; renovations", "Switchboard upgrades", "Power points &amp; lighting", "Safety inspections", "3-phase upgrades", "Underground power"]) {
      html += `<li>${s}</li>`;
    }
    html += `</ul>`;
  }

  if (page.recentProjects) {
    html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">Recent work in ${escapeHtml(page.suburb)}</h2>`;
    html += `<div style="color:#374151;line-height:1.8;white-space:pre-wrap;">${escapeHtml(page.recentProjects)}</div>`;
  }

  if (page.localTestimonial) {
    html += `<blockquote style="border-left:4px solid #ea6c00;padding:0.75rem 1rem;margin:1.5rem 0;font-style:italic;color:#4b5563;">`;
    html += `"${escapeHtml(page.localTestimonial)}"`;
    if (page.localTestimonialAuthor) {
      html += `<footer style="font-style:normal;font-weight:600;color:#1e3a5f;margin-top:0.5rem;">— ${escapeHtml(page.localTestimonialAuthor)}</footer>`;
    }
    html += `</blockquote>`;
  }

  if (page.localFaqs) {
    const faqs = parseLocalFaqs(page.localFaqs);
    if (faqs.length > 0) {
      html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">Common questions about electricians in ${escapeHtml(page.suburb)}</h2>`;
      html += `<dl style="color:#374151;">`;
      for (const faq of faqs) {
        html += `<dt style="font-weight:600;margin-top:1rem;">${escapeHtml(faq.q)}</dt>`;
        html += `<dd style="margin-left:1rem;line-height:1.7;">${escapeHtml(faq.a)}</dd>`;
      }
      html += `</dl>`;
    }
  }

  if (page.nearbyAreas) {
    const areas = page.nearbyAreas.split(",").map((s) => s.trim()).filter(Boolean);
    if (areas.length > 0) {
      html += `<h2 style="color:#1e3a5f;margin-top:1.5rem;">We also cover areas near ${escapeHtml(page.suburb)}</h2>`;
      html += `<p style="color:#374151;">${areas.map((a) => escapeHtml(a)).join(", ")}</p>`;
    }
  }

  html += `<div style="margin-top:2rem;background:#1e3a5f;color:#fff;border-radius:1rem;padding:2rem;text-align:center;">`;
  html += `<h3>Need an electrician in ${escapeHtml(page.suburb)}?</h3>`;
  html += `<p>Get a free quote or book a job — we&#39;d love to help.</p>`;
  html += `<a href="/quote" style="color:#ea6c00;font-weight:600;">Get a Free Quote</a> &nbsp;|&nbsp; <a href="tel:0419868703" style="color:#fff;">Call 0419 868 703</a>`;
  html += `</div>`;
  html += `</div>`;
  return html;
}

const STATIC_ROUTES: Array<{
  path: string;
  title: string;
  description: string;
  bodyHtml?: string;
}> = [
  {
    path: "/",
    title: "Electrical Installers | Licensed Electricians Mornington Peninsula",
    description:
      "Victorian licensed electricians serving Mornington Peninsula, Bayside and South East Melbourne. Specialists in residential & commercial electrical, underground power, renovations and 3-phase upgrades. Call 0419 868 703.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Mornington Peninsula's Electrical Specialists</h1>" +
      "<p>35 years of design expertise. Precision installation. Licensed electricians (REC 25510) serving the Mornington Peninsula, Bayside, and South East Melbourne.</p>" +
      "<p>Specialists in residential and commercial electrical, underground power, switchboard upgrades, and 3-phase industrial upgrades.</p>" +
      "<h2>Our Services</h2>" +
      "<ul>" +
      "<li><strong>New Homes &amp; Renovations</strong> — Full wiring for new builds and renovations.</li>" +
      "<li><strong>Commercial &amp; Industrial</strong> — Factory fit-outs, machinery wiring, compliance.</li>" +
      "<li><strong>3-Phase Power Upgrades</strong> — For workshops, small businesses, and heavy equipment.</li>" +
      "<li><strong>Sheds &amp; Garages</strong> — Proper circuits, lighting, and safety protection.</li>" +
      "<li><strong>Underground Power</strong> — Full United Energy 5-step process management.</li>" +
      "</ul>" +
      "<h2>Service Areas</h2>" +
      "<p>Mornington Peninsula, Bayside, St Kilda, Frankston, Mount Eliza, Mornington, Rosebud, Rye, Sorrento, Portsea, and Warragul.</p>" +
      '<p><a href="/book" style="color:#ea6c00;font-weight:600;">Book an Appointment</a> or call <a href="tel:0419868703" style="color:#1e3a5f;font-weight:600;">0419 868 703</a></p>' +
      "</div>",
  },
  {
    path: "/about",
    title: "About Us | Electrical Installers",
    description:
      "Licensed Victorian electricians with 35 years of experience. Serving Mornington Peninsula, Bayside, and South East Melbourne. Honest, reliable, fully insured electrical contractors.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>About Electrical Installers</h1>" +
      "<p>Victorian licensed electricians (REC 25510) with over 35 years of design expertise, serving the Mornington Peninsula, Bayside, and South East Melbourne.</p>" +
      "<p>Fully licensed and insured, with a commitment to honest, reliable workmanship on every job — residential, commercial, and industrial.</p>" +
      '<p>Call us: <a href="tel:0419868703" style="color:#1e3a5f;font-weight:600;">0419 868 703</a></p>' +
      "</div>",
  },
  {
    path: "/underground-power",
    title: "Underground Power Specialists | Mornington Peninsula",
    description:
      "Expert underground power connection on the Mornington Peninsula. We manage the full United Energy 5-step process — inspection to final connection. Get a free quote today.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Underground Power Specialists</h1>" +
      "<p>We guide you through the full United Energy 5-step underground power process on the Mornington Peninsula. From on-site inspection and UE application to excavation, cabling, and final connection — our licensed electricians handle every step.</p>" +
      "<h2>The 5-Step United Energy Process</h2>" +
      "<ol>" +
      "<li><strong>On-site inspection</strong> — We assess your property and prepare a site plan.</li>" +
      "<li><strong>United Energy application</strong> — We lodge the paperwork on your behalf.</li>" +
      "<li><strong>Truck appointment</strong> — UE sends a truck to disconnect the overhead supply.</li>" +
      "<li><strong>Trenching &amp; cabling</strong> — We excavate and install the underground cable.</li>" +
      "<li><strong>Final connection</strong> — UE reconnects the supply underground.</li>" +
      "</ol>" +
      '<p><a href="/quote" style="color:#ea6c00;font-weight:600;">Get a free quote today</a></p>' +
      "</div>",
  },
  {
    path: "/portfolio",
    title: "Electrical Work Portfolio | Before & After Photos",
    description:
      "Browse before and after photos of our completed electrical projects across the Mornington Peninsula, Bayside, and South East Melbourne. Residential and commercial work.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Our Electrical Work Portfolio</h1>" +
      "<p>See before and after photos of our completed electrical projects across Mornington Peninsula, Bayside, and South East Melbourne — residential and commercial electrical, underground power, switchboard upgrades, and more.</p>" +
      '<p><a href="/book" style="color:#ea6c00;font-weight:600;">Book your project today</a></p>' +
      "</div>",
  },
  {
    path: "/reviews",
    title: "Customer Reviews | Electrical Installers",
    description:
      "Read genuine customer reviews for Electrical Installers. Highly rated licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Customer Reviews</h1>" +
      "<p>See what our customers say about Electrical Installers. Licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne with reliable, professional electrical services.</p>" +
      "</div>",
  },
  {
    path: "/book",
    title: "Book an Electrician | Mornington Peninsula",
    description:
      "Book a licensed electrician on the Mornington Peninsula. Request a consultation, quote, or job booking online. Fast confirmation — call 0419 868 703.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Book an Appointment</h1>" +
      "<p>Book a licensed electrician on the Mornington Peninsula. Fill out our booking form to request a consultation, quote, or job booking. We confirm appointments promptly.</p>" +
      '<p>Call <a href="tel:0419868703" style="color:#1e3a5f;font-weight:600;">0419 868 703</a></p>' +
      "</div>",
  },
  {
    path: "/quote",
    title: "Get a Free Electrical Quote | Electrical Installers",
    description:
      "Request a free virtual electrical quote. Describe your project and attach photos — we'll provide indicative pricing without needing a site visit first.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Get a Free Electrical Quote</h1>" +
      "<p>Request a free virtual electrical quote for your project. Describe your work and attach photos. We'll provide indicative pricing and follow up to arrange a site visit.</p>" +
      "</div>",
  },
  {
    path: "/faq",
    title: "Electrical FAQs | Mornington Peninsula Electricians",
    description:
      "Frequently asked questions about electrical work on the Mornington Peninsula. Answers from licensed electricians on safety, pricing, permits, switchboards, and more.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Frequently Asked Questions</h1>" +
      "<p>Common questions about electrical work — answered by our licensed electricians. Learn about safety, pricing, permits, switchboards, underground power, and what to expect when you book an electrician on the Mornington Peninsula.</p>" +
      "</div>",
  },
  {
    path: "/pricing",
    title: "Electrical Pricing Guide | Mornington Peninsula",
    description:
      "Indicative electrical pricing for common jobs on the Mornington Peninsula — power points, switchboard upgrades, underground power, lighting, and more.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Electrical Pricing Guide</h1>" +
      "<p>Indicative price ranges for common electrical jobs on the Mornington Peninsula. Actual quotes depend on your specific requirements.</p>" +
      '<p><a href="/quote" style="color:#ea6c00;font-weight:600;">Contact us for a free personalised quote</a></p>' +
      "</div>",
  },
  {
    path: "/messages",
    title: "Message Us | Electrical Installers",
    description:
      "Send a message to our electrical team about your project. Start a private conversation — no account needed. We reply promptly.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Message Us</h1>" +
      "<p>Send our team a message about your electrical project. Start a private conversation — no account needed. We reply promptly.</p>" +
      "</div>",
  },
  {
    path: "/track",
    title: "Track Your Booking | Electrical Installers",
    description:
      "Track the status of your electrical booking using your reference number. See real-time updates on your job progress.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Track Your Booking</h1>" +
      "<p>Track the status of your electrical booking using your reference number. See real-time updates on your job progress.</p>" +
      "</div>",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | Electrical Installers",
    description:
      "Privacy policy for Electrical Installers — how we collect, use, and protect your personal information.",
    bodyHtml:
      '<div style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:2rem 1rem;">' +
      "<h1>Privacy Policy</h1>" +
      "<p>This privacy policy describes how Electrical Installers collects, uses, and protects your personal information in accordance with Australian privacy law.</p>" +
      "</div>",
  },
];

async function main() {
  console.log("\nPrerendering public routes for SEO...\n");

  if (!fs.existsSync(INDEX_HTML)) {
    console.error(
      `index.html not found at ${INDEX_HTML}. Run vite build first.`,
    );
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_HTML, "utf-8");

  console.log("Static routes:");
  for (const route of STATIC_ROUTES) {
    const html = injectMeta(baseHtml, {
      title: route.title,
      description: route.description,
      canonicalPath: route.path,
      bodyHtml: route.bodyHtml,
    });
    writeRoute(route.path, html);
  }

  console.log("\nListing pages + dynamic detail routes (from database):");

  // DATABASE_URL is required. If it is absent the build fails so that
  // dynamic SEO pages (blog, service, suburb) are never silently omitted
  // from a production deployment. Provide DATABASE_URL in your build
  // environment (or CI secrets) to enable full prerendering.
  if (!process.env.DATABASE_URL) {
    console.error(
      "\nError: DATABASE_URL is not set. Cannot prerender dynamic routes (blog posts, service pages, suburb pages).",
    );
    console.error(
      "Set DATABASE_URL in your build environment to generate route-specific HTML for every public detail page.\n",
    );
    process.exit(1);
  }

  // Dynamic import keeps @workspace/db from throwing at module load time when
  // DATABASE_URL happens to be missing, but here we know it is present so any
  // error propagates and fails the build.
  const { db, blogPostsTable, servicePagesTable, suburbPagesTable } =
    await import("@workspace/db");
  const { eq } = await import("drizzle-orm");

  const [blogPosts, servicePages, suburbPages] = await Promise.all([
    db
      .select({
        slug: blogPostsTable.slug,
        title: blogPostsTable.title,
        excerpt: blogPostsTable.excerpt,
        content: blogPostsTable.content,
        category: blogPostsTable.category,
        imageUrl: blogPostsTable.imageUrl,
        publishedAt: blogPostsTable.publishedAt,
      })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.status, "published")),

    db
      .select({
        slug: servicePagesTable.slug,
        title: servicePagesTable.title,
        shortDescription: servicePagesTable.shortDescription,
        fullDescription: servicePagesTable.fullDescription,
        bullets: servicePagesTable.bullets,
        pricingBlurb: servicePagesTable.pricingBlurb,
        portfolioCategory: servicePagesTable.portfolioCategory,
        heroImageUrl: servicePagesTable.heroImageUrl,
      })
      .from(servicePagesTable),

    db
      .select({
        slug: suburbPagesTable.slug,
        suburb: suburbPagesTable.suburb,
        heading: suburbPagesTable.heading,
        intro: suburbPagesTable.intro,
        servicesCopy: suburbPagesTable.servicesCopy,
        recentProjects: suburbPagesTable.recentProjects,
        localTestimonial: suburbPagesTable.localTestimonial,
        localTestimonialAuthor: suburbPagesTable.localTestimonialAuthor,
        nearbyAreas: suburbPagesTable.nearbyAreas,
        localFaqs: suburbPagesTable.localFaqs,
      })
      .from(suburbPagesTable),
  ]);

  // --- Listing pages with real crawlable content and links ---

  writeRoute(
    "/blog",
    injectMeta(baseHtml, {
      title: "Electrical Tips & Guides | Electrical Installers",
      description:
        "Practical electrical tips and guides from our licensed electricians. Learn about home electrical systems, safety, switchboards, underground power, and more.",
      canonicalPath: "/blog",
      bodyHtml: renderBlogListBody(blogPosts),
    }),
  );

  writeRoute(
    "/services",
    injectMeta(baseHtml, {
      title: "Electrical Services | Mornington Peninsula Electricians",
      description:
        "Full range of residential and commercial electrical services on the Mornington Peninsula. New homes, renovations, switchboard upgrades, underground power, 3-phase upgrades, and more.",
      canonicalPath: "/services",
      bodyHtml: renderServicesListBody(servicePages),
    }),
  );

  writeRoute(
    "/service-area",
    injectMeta(baseHtml, {
      title: "Service Areas | Mornington Peninsula Electricians",
      description:
        "Electrical Installers serves the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding South East Melbourne areas. Licensed local electricians.",
      canonicalPath: "/service-area",
      bodyHtml: renderSuburbListBody(suburbPages),
    }),
  );

  // --- Individual detail pages ---

  for (const post of blogPosts) {
    const canonicalPath = `/blog/${post.slug}`;
    const html = injectMeta(baseHtml, {
      title: `${post.title} | Electrical Installers`,
      description: post.excerpt,
      canonicalPath,
      ogImage: post.imageUrl ?? DEFAULT_OG_IMAGE,
      ogType: "article",
      bodyHtml: renderBlogPostBody(post),
    });
    writeRoute(canonicalPath, html);
  }

  for (const page of servicePages) {
    const canonicalPath = `/services/${page.slug}`;
    const html = injectMeta(baseHtml, {
      title: `${page.title} | Mornington Peninsula Electricians`,
      description: page.shortDescription,
      canonicalPath,
      ogImage: page.heroImageUrl ?? DEFAULT_OG_IMAGE,
      bodyHtml: renderServicePageBody(page),
    });
    writeRoute(canonicalPath, html);
  }

  for (const page of suburbPages) {
    const canonicalPath = `/${page.slug}`;
    const description = truncate(page.intro, 160);
    const html = injectMeta(baseHtml, {
      title: `${page.heading} | Electrical Installers`,
      description,
      canonicalPath,
      bodyHtml: renderSuburbPageBody(page),
    });
    writeRoute(canonicalPath, html);
  }

  console.log(
    `\n  ${blogPosts.length} blog posts, ${servicePages.length} service pages, ${suburbPages.length} suburb pages`,
  );

  console.log("\nPrerendering complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
