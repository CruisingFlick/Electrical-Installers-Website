import { Router } from "express";
import { db, bookingsTable, reviewsTable, quotesTable, portfolioTable } from "@workspace/db";
import { eq, count, sql, and, isNull } from "drizzle-orm";
import { requireAdmin } from "../middleware/admin-auth";

const router = Router();

router.get("/summary", requireAdmin, async (req, res, next) => {
  try {
    const [totalBookings] = await db
      .select({ count: count() })
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt));

    const [pendingBookings] = await db
      .select({ count: count() })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.status, "pending"), isNull(bookingsTable.deletedAt)));

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
      .where(sql`created_at > now() - interval '30 days' and deleted_at is null`);

    const topServiceRows = await db
      .select({ serviceType: bookingsTable.serviceType, cnt: count() })
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt))
      .groupBy(bookingsTable.serviceType)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    const topRegionRows = await db
      .select({ suburb: bookingsTable.suburb, cnt: count() })
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt))
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
      topService: topServiceRows[0]?.serviceType ?? null,
      topRegion: topRegionRows[0]?.suburb ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/bookings-by-service", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select({ service: bookingsTable.jobType, count: count() })
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt))
      .groupBy(bookingsTable.jobType)
      .orderBy(sql`count(*) desc`);

    res.json(rows.map((r) => ({ service: r.service, count: r.count })));
  } catch (err) {
    next(err);
  }
});

router.get("/bookings-by-region", requireAdmin, async (req, res, next) => {
  try {
    const rows = await db
      .select({ region: bookingsTable.suburb, count: count() })
      .from(bookingsTable)
      .where(isNull(bookingsTable.deletedAt))
      .groupBy(bookingsTable.suburb)
      .orderBy(sql`count(*) desc`);

    res.json(rows.map((r) => ({ region: r.region, count: r.count })));
  } catch (err) {
    next(err);
  }
});

export default router;
