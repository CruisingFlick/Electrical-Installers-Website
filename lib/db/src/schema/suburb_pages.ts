import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suburbPagesTable = pgTable("suburb_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  suburb: text("suburb").notNull(),
  heading: text("heading").notNull(),
  intro: text("intro").notNull(),
  portfolioSuburb: text("portfolio_suburb"),
  servicesCopy: text("services_copy"),
  recentProjects: text("recent_projects"),
  localTestimonial: text("local_testimonial"),
  localTestimonialAuthor: text("local_testimonial_author"),
  nearbyAreas: text("nearby_areas"),
  localFaqs: text("local_faqs"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSuburbPageSchema = createInsertSchema(suburbPagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSuburbPage = z.infer<typeof insertSuburbPageSchema>;
export type SuburbPage = typeof suburbPagesTable.$inferSelect;
