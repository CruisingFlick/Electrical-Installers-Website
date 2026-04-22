import { Router } from "express";
import { db, bookingsTable, reviewsTable, quotesTable, portfolioTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [totalBookings] = await db
    .select({ count: count() })
    .from(bookingsTable);

  const [pendingBookings] = await db
    .select({ count: count() })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "pending"));

  const [totalQuotes] = await db
    .select({ count: count() })
    .from(quotesTable);

  const [pendingReviews] = await db
    .select({ count: count() })
    .from(reviewsTable)
    .where(eq(reviewsTable.status, "pending"));

  const [totalPortfolio] = await db
    .select({ count: count() })
    .from(portfolioTable);

  const recentBookings = await db
    .select({ count: count() })
    .from(bookingsTable)
    .where(sql`created_at > now() - interval '30 days'`);

  const topServiceRows = await db
    .select({ serviceType: bookingsTable.serviceType, cnt: count() })
    .from(bookingsTable)
    .groupBy(bookingsTable.serviceType)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  const topRegionRows = await db
    .select({ suburb: bookingsTable.suburb, cnt: count() })
    .from(bookingsTable)
    .groupBy(bookingsTable.suburb)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  res.json({
    totalBookings: totalBookings.count,
    pendingBookings: pendingBookings.count,
    totalQuotes: totalQuotes.count,
    pendingReviews: pendingReviews.count,
    totalPortfolioItems: totalPortfolio.count,
    recentBookingsCount: recentBookings[0]?.count ?? 0,
    topService: topServiceRows[0]?.serviceType ?? "N/A",
    topRegion: topRegionRows[0]?.suburb ?? "N/A",
  });
});

router.get("/bookings-by-service", async (req, res) => {
  const rows = await db
    .select({ service: bookingsTable.jobType, count: count() })
    .from(bookingsTable)
    .groupBy(bookingsTable.jobType)
    .orderBy(sql`count(*) desc`);

  res.json(rows.map((r) => ({ service: r.service, count: r.count })));
});

router.get("/bookings-by-region", async (req, res) => {
  const rows = await db
    .select({ region: bookingsTable.suburb, count: count() })
    .from(bookingsTable)
    .groupBy(bookingsTable.suburb)
    .orderBy(sql`count(*) desc`);

  res.json(rows.map((r) => ({ region: r.region, count: r.count })));
});

export default router;
