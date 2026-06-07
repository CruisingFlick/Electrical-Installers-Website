import { Router } from "express";
import {
  db,
  settings,
  googleReviewsCacheTable,
  type GoogleReviewItem,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type GoogleReviewsPayload = {
  configured: boolean;
  rating: number | null;
  totalRatings: number | null;
  reviews: GoogleReviewItem[];
  reviewsUrl: string;
};

async function getSetting(key: string): Promise<string> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows[0]?.value ?? "";
}

async function fetchFromGoogle(
  placeId: string,
  apiKey: string,
): Promise<{ rating: number | null; totalRatings: number | null; reviews: GoogleReviewItem[] } | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    logger.error({ status: res.status }, "Google Places API request failed");
    return null;
  }
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      rating?: number;
      user_ratings_total?: number;
      reviews?: Array<{
        author_name: string;
        rating: number;
        text: string;
        relative_time_description: string;
        profile_photo_url?: string;
        time: number;
      }>;
    };
  };

  if (data.status !== "OK" || !data.result) {
    logger.error({ status: data.status, message: data.error_message }, "Google Places API returned non-OK status");
    return null;
  }

  const reviews: GoogleReviewItem[] = (data.result.reviews ?? []).map((r) => ({
    authorName: r.author_name,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relative_time_description,
    profilePhotoUrl: r.profile_photo_url,
    time: r.time,
  }));

  return {
    rating: data.result.rating ?? null,
    totalRatings: data.result.user_ratings_total ?? null,
    reviews,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const placeId = await getSetting("googlePlaceId");
    const reviewsUrl = await getSetting("googleReviewsUrl");
    const apiKey = process.env["GOOGLE_PLACES_API_KEY"] ?? "";

    const empty: GoogleReviewsPayload = {
      configured: false,
      rating: null,
      totalRatings: null,
      reviews: [],
      reviewsUrl,
    };

    if (!placeId || !apiKey) {
      res.json(empty);
      return;
    }

    const [cached] = await db
      .select()
      .from(googleReviewsCacheTable)
      .where(eq(googleReviewsCacheTable.placeId, placeId))
      .orderBy(desc(googleReviewsCacheTable.fetchedAt))
      .limit(1);

    const isFresh = cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS;

    if (isFresh) {
      res.json({
        configured: true,
        rating: cached.rating,
        totalRatings: cached.totalRatings,
        reviews: cached.reviews,
        reviewsUrl,
      } satisfies GoogleReviewsPayload);
      return;
    }

    const fresh = await fetchFromGoogle(placeId, apiKey);

    if (!fresh) {
      // Fall back to stale cache if available, otherwise empty.
      if (cached) {
        res.json({
          configured: true,
          rating: cached.rating,
          totalRatings: cached.totalRatings,
          reviews: cached.reviews,
          reviewsUrl,
        } satisfies GoogleReviewsPayload);
        return;
      }
      res.json(empty);
      return;
    }

    await db.insert(googleReviewsCacheTable).values({
      placeId,
      rating: fresh.rating,
      totalRatings: fresh.totalRatings,
      reviews: fresh.reviews,
    });

    res.json({
      configured: true,
      rating: fresh.rating,
      totalRatings: fresh.totalRatings,
      reviews: fresh.reviews,
      reviewsUrl,
    } satisfies GoogleReviewsPayload);
  } catch (err) {
    next(err);
  }
});

export default router;
