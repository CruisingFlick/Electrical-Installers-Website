import { Router } from "express";
import { db, blogPostsTable, servicePagesTable, suburbPagesTable } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const sitemapRouter = Router();

const BASE_URL = "https://www.electricalinstallers.com.au";

function url(
  loc: string,
  changefreq: string,
  priority: string,
  lastmod?: string,
): string {
  const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const STATIC_URLS: string[] = [
  url("/", "weekly", "1.0"),
  url("/services", "monthly", "0.9"),
  url("/underground-power", "monthly", "0.8"),
  url("/service-area", "monthly", "0.8"),
  url("/portfolio", "weekly", "0.8"),
  url("/reviews", "weekly", "0.7"),
  url("/book", "monthly", "0.9"),
  url("/quote", "monthly", "0.9"),
  url("/blog", "weekly", "0.8"),
  url("/faq", "monthly", "0.7"),
  url("/pricing", "monthly", "0.7"),
  url("/about", "monthly", "0.7"),
  url("/messages", "monthly", "0.5"),
  url("/track", "monthly", "0.5"),
  url("/privacy-policy", "yearly", "0.3"),
];

sitemapRouter.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const [blogPosts, servicePages, suburbPages] = await Promise.all([
      db
        .select({ slug: blogPostsTable.slug, updatedAt: blogPostsTable.updatedAt })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published"))
        .orderBy(desc(blogPostsTable.updatedAt)),
      db
        .select({ slug: servicePagesTable.slug })
        .from(servicePagesTable)
        .orderBy(asc(servicePagesTable.sortOrder), asc(servicePagesTable.id)),
      db
        .select({ slug: suburbPagesTable.slug })
        .from(suburbPagesTable)
        .orderBy(asc(suburbPagesTable.sortOrder), asc(suburbPagesTable.id)),
    ]);

    const dynamicUrls: string[] = [
      ...blogPosts.map((p) =>
        url(
          `/blog/${p.slug}`,
          "monthly",
          "0.7",
          p.updatedAt.toISOString().split("T")[0],
        )
      ),
      ...servicePages.map((p) => url(`/services/${p.slug}`, "monthly", "0.8")),
      ...suburbPages.map((p) => url(`/${p.slug}`, "monthly", "0.8")),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...STATIC_URLS, ...dynamicUrls].join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    logger.error({ err }, "Failed to generate sitemap");
    next(err);
  }
});

export default sitemapRouter;
