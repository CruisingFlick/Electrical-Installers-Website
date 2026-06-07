import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicePagesTable = pgTable("service_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  bullets: text("bullets").array().notNull(),
  pricingBlurb: text("pricing_blurb"),
  portfolioCategory: text("portfolio_category"),
  heroImageUrl: text("hero_image_url"),
  externalPath: text("external_path"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServicePageSchema = createInsertSchema(servicePagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServicePage = z.infer<typeof insertServicePageSchema>;
export type ServicePage = typeof servicePagesTable.$inferSelect;
