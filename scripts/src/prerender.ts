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
    noscriptHtml?: string;
  },
): string {
  const {
    title,
    description,
    canonicalPath,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    noscriptHtml,
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

  if (noscriptHtml) {
    result = result.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n<noscript id="seo-content" style="display:block">${noscriptHtml}</noscript>`,
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

const STATIC_ROUTES: Array<{
  path: string;
  title: string;
  description: string;
  noscript?: string;
}> = [
  {
    path: "/",
    title: "Electrical Installers | Licensed Electricians Mornington Peninsula",
    description:
      "Victorian licensed electricians serving Mornington Peninsula, Bayside and South East Melbourne. Specialists in residential & commercial electrical, underground power, renovations and 3-phase upgrades. Call 0419 868 703.",
    noscript:
      "<h1>Mornington Peninsula's Electrical Specialists</h1><p>35 years of design expertise. Precision installation. Licensed electricians (REC 25510) serving the Mornington Peninsula, Bayside, and South East Melbourne. Specialists in residential and commercial electrical, underground power, switchboard upgrades, and 3-phase industrial upgrades.</p><p>Call us: 0419 868 703</p>",
  },
  {
    path: "/about",
    title: "About Us | Electrical Installers",
    description:
      "Licensed Victorian electricians with 35 years of experience. Serving Mornington Peninsula, Bayside, and South East Melbourne. Honest, reliable, fully insured electrical contractors.",
    noscript:
      "<h1>About Electrical Installers</h1><p>Victorian licensed electricians (REC 25510) with over 35 years of design expertise, serving the Mornington Peninsula, Bayside, and South East Melbourne. Fully licensed and insured, with a commitment to honest, reliable workmanship on every job.</p>",
  },
  {
    path: "/underground-power",
    title: "Underground Power Specialists | Mornington Peninsula",
    description:
      "Expert underground power connection on the Mornington Peninsula. We manage the full United Energy 5-step process — inspection to final connection. Get a free quote today.",
    noscript:
      "<h1>Underground Power Specialists</h1><p>We guide you through the full United Energy 5-step underground power process on the Mornington Peninsula. From on-site inspection and UE application to excavation, cabling, and final connection — our licensed electricians handle every step.</p>",
  },
  {
    path: "/portfolio",
    title: "Electrical Work Portfolio | Before & After Photos",
    description:
      "Browse before and after photos of our completed electrical projects across the Mornington Peninsula, Bayside, and South East Melbourne. Residential and commercial work.",
    noscript:
      "<h1>Our Electrical Work Portfolio</h1><p>See before and after photos of our completed electrical projects across Mornington Peninsula, Bayside, and South East Melbourne — residential and commercial electrical, underground power, switchboard upgrades, and more.</p>",
  },
  {
    path: "/reviews",
    title: "Customer Reviews | Electrical Installers",
    description:
      "Read genuine customer reviews for Electrical Installers. Highly rated licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne.",
    noscript:
      "<h1>Customer Reviews</h1><p>See what our customers say about Electrical Installers. Licensed electricians serving Mornington Peninsula, Bayside, and South East Melbourne with reliable, professional electrical services.</p>",
  },
  {
    path: "/book",
    title: "Book an Electrician | Mornington Peninsula",
    description:
      "Book a licensed electrician on the Mornington Peninsula. Request a consultation, quote, or job booking online. Fast confirmation — call 0419 868 703.",
    noscript:
      "<h1>Book an Appointment</h1><p>Book a licensed electrician on the Mornington Peninsula. Fill out our booking form to request a consultation, quote, or job booking. We confirm appointments promptly. Call 0419 868 703.</p>",
  },
  {
    path: "/quote",
    title: "Get a Free Electrical Quote | Electrical Installers",
    description:
      "Request a free virtual electrical quote. Describe your project and attach photos — we'll provide indicative pricing without needing a site visit first.",
    noscript:
      "<h1>Get a Free Electrical Quote</h1><p>Request a free virtual electrical quote for your project. Describe your work and attach photos. We'll provide indicative pricing and follow up to arrange a site visit.</p>",
  },
  {
    path: "/faq",
    title: "Electrical FAQs | Mornington Peninsula Electricians",
    description:
      "Frequently asked questions about electrical work on the Mornington Peninsula. Answers from licensed electricians on safety, pricing, permits, switchboards, and more.",
    noscript:
      "<h1>Frequently Asked Questions</h1><p>Common questions about electrical work — answered by our licensed electricians. Learn about safety, pricing, permits, switchboards, underground power, and what to expect when you book an electrician on the Mornington Peninsula.</p>",
  },
  {
    path: "/pricing",
    title: "Electrical Pricing Guide | Mornington Peninsula",
    description:
      "Indicative electrical pricing for common jobs on the Mornington Peninsula — power points, switchboard upgrades, underground power, lighting, and more.",
    noscript:
      "<h1>Electrical Pricing Guide</h1><p>Indicative price ranges for common electrical jobs on the Mornington Peninsula. Actual quotes depend on your specific requirements. Contact us for a free personalised quote.</p>",
  },
  {
    path: "/messages",
    title: "Message Us | Electrical Installers",
    description:
      "Send a message to our electrical team about your project. Start a private conversation — no account needed. We reply promptly.",
    noscript:
      "<h1>Message Us</h1><p>Send our team a message about your electrical project. Start a private conversation — no account needed. We reply promptly.</p>",
  },
  {
    path: "/track",
    title: "Track Your Booking | Electrical Installers",
    description:
      "Track the status of your electrical booking using your reference number. See real-time updates on your job progress.",
    noscript:
      "<h1>Track Your Booking</h1><p>Track the status of your electrical booking using your reference number. See real-time updates on your job progress.</p>",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | Electrical Installers",
    description:
      "Privacy policy for Electrical Installers — how we collect, use, and protect your personal information.",
    noscript:
      "<h1>Privacy Policy</h1><p>This privacy policy describes how Electrical Installers collects, uses, and protects your personal information in accordance with Australian privacy law.</p>",
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
      noscriptHtml: route.noscript,
    });
    writeRoute(route.path, html);
  }

  console.log("\nListing pages + dynamic detail routes (from database):");

  // If DATABASE_URL is absent there is genuinely no DB in this build environment
  // — write the listing pages with generic noscript copy and skip detail routes,
  // with a clear warning. If DATABASE_URL IS set, any failure is a real error and
  // must abort the build so dynamic SEO pages are never silently omitted from a
  // production deployment.
  if (!process.env.DATABASE_URL) {
    console.warn(
      "\nWarning: DATABASE_URL not set — using generic noscript for listing pages; detail routes skipped.",
    );
    console.warn("Set DATABASE_URL at build time to prerender dynamic pages.\n");

    // Write listing pages with plain fallback noscript (no crawlable links)
    writeRoute(
      "/blog",
      injectMeta(baseHtml, {
        title: "Electrical Tips & Guides | Electrical Installers",
        description:
          "Practical electrical tips and guides from our licensed electricians. Learn about home electrical systems, safety, switchboards, underground power, and more.",
        canonicalPath: "/blog",
        noscriptHtml:
          "<h1>Electrical Tips &amp; Guides</h1><p>Practical advice from our licensed electricians helping you understand your home's electrical system, stay safe, and get the most from your electrical investment on the Mornington Peninsula.</p>",
      }),
    );
    writeRoute(
      "/services",
      injectMeta(baseHtml, {
        title: "Electrical Services | Mornington Peninsula Electricians",
        description:
          "Full range of residential and commercial electrical services on the Mornington Peninsula. New homes, renovations, switchboard upgrades, underground power, 3-phase upgrades, and more.",
        canonicalPath: "/services",
        noscriptHtml:
          "<h1>Our Electrical Services</h1><p>Complete electrical services for residential and commercial properties across the Mornington Peninsula, Bayside, and South East Melbourne. New home wiring, renovations, switchboard upgrades, underground power, 3-phase industrial work, and safety inspections.</p>",
      }),
    );
    writeRoute(
      "/service-area",
      injectMeta(baseHtml, {
        title: "Service Areas | Mornington Peninsula Electricians",
        description:
          "Electrical Installers serves the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding South East Melbourne areas. Licensed local electricians.",
        canonicalPath: "/service-area",
        noscriptHtml:
          "<h1>Our Service Areas</h1><p>We serve residential and commercial customers across the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding areas of South East Melbourne with professional electrical services.</p>",
      }),
    );
  } else {
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
          imageUrl: blogPostsTable.imageUrl,
        })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published")),

      db
        .select({
          slug: servicePagesTable.slug,
          title: servicePagesTable.title,
          shortDescription: servicePagesTable.shortDescription,
          heroImageUrl: servicePagesTable.heroImageUrl,
        })
        .from(servicePagesTable),

      db
        .select({
          slug: suburbPagesTable.slug,
          suburb: suburbPagesTable.suburb,
          heading: suburbPagesTable.heading,
          intro: suburbPagesTable.intro,
        })
        .from(suburbPagesTable),
    ]);

    // --- Listing pages with real crawlable anchor links ---

    // /blog — link to every published post
    const blogLinksHtml =
      blogPosts.length > 0
        ? `<ul>${blogPosts.map((p) => `<li><a href="/blog/${p.slug}">${escapeAttr(p.title)}</a> — ${escapeAttr(truncate(p.excerpt, 120))}</li>`).join("")}</ul>`
        : "";
    writeRoute(
      "/blog",
      injectMeta(baseHtml, {
        title: "Electrical Tips & Guides | Electrical Installers",
        description:
          "Practical electrical tips and guides from our licensed electricians. Learn about home electrical systems, safety, switchboards, underground power, and more.",
        canonicalPath: "/blog",
        noscriptHtml: `<h1>Electrical Tips &amp; Guides</h1><p>Practical advice from our licensed electricians helping you understand your home's electrical system, stay safe, and get the most from your electrical investment on the Mornington Peninsula.</p>${blogLinksHtml}`,
      }),
    );

    // /services — link to every CMS service detail page
    const serviceLinksHtml =
      servicePages.length > 0
        ? `<ul>${servicePages.map((p) => `<li><a href="/services/${p.slug}">${escapeAttr(p.title)}</a> — ${escapeAttr(truncate(p.shortDescription, 120))}</li>`).join("")}</ul>`
        : "";
    writeRoute(
      "/services",
      injectMeta(baseHtml, {
        title: "Electrical Services | Mornington Peninsula Electricians",
        description:
          "Full range of residential and commercial electrical services on the Mornington Peninsula. New homes, renovations, switchboard upgrades, underground power, 3-phase upgrades, and more.",
        canonicalPath: "/services",
        noscriptHtml: `<h1>Our Electrical Services</h1><p>Complete electrical services for residential and commercial properties across the Mornington Peninsula, Bayside, and South East Melbourne. New home wiring, renovations, switchboard upgrades, underground power, 3-phase industrial work, and safety inspections.</p>${serviceLinksHtml}`,
      }),
    );

    // /service-area — link to every suburb landing page
    const suburbLinksHtml =
      suburbPages.length > 0
        ? `<ul>${suburbPages.map((p) => `<li><a href="/${p.slug}">${escapeAttr(p.suburb)}</a></li>`).join("")}</ul>`
        : "";
    writeRoute(
      "/service-area",
      injectMeta(baseHtml, {
        title: "Service Areas | Mornington Peninsula Electricians",
        description:
          "Electrical Installers serves the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding South East Melbourne areas. Licensed local electricians.",
        canonicalPath: "/service-area",
        noscriptHtml: `<h1>Our Service Areas</h1><p>We serve residential and commercial customers across the Mornington Peninsula, Bayside, St Kilda, Warragul, and surrounding areas of South East Melbourne with professional electrical services.</p>${suburbLinksHtml}`,
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
        noscriptHtml: `<h1>${escapeAttr(post.title)}</h1><p>${escapeAttr(post.excerpt)}</p>`,
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
        noscriptHtml: `<h1>${escapeAttr(page.title)}</h1><p>${escapeAttr(page.shortDescription)}</p>`,
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
        noscriptHtml: `<h1>${escapeAttr(page.heading)}</h1><p>${escapeAttr(truncate(page.intro, 500))}</p>`,
      });
      writeRoute(canonicalPath, html);
    }

    console.log(
      `\n  ${blogPosts.length} blog posts, ${servicePages.length} service pages, ${suburbPages.length} suburb pages`,
    );
  }

  console.log("\nPrerendering complete.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
