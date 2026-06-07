import { pgTable, serial, text, integer, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";

export type GoogleReviewItem = {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl?: string;
  time: number;
};

export const googleReviewsCacheTable = pgTable("google_reviews_cache", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  rating: doublePrecision("rating"),
  totalRatings: integer("total_ratings"),
  reviews: jsonb("reviews").$type<GoogleReviewItem[]>().notNull().default([]),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export type GoogleReviewsCache = typeof googleReviewsCacheTable.$inferSelect;
