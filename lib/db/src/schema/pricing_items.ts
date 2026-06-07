import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pricingItemsTable = pgTable("pricing_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  priceRange: text("price_range").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPricingItemSchema = createInsertSchema(pricingItemsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPricingItem = z.infer<typeof insertPricingItemSchema>;
export type PricingItem = typeof pricingItemsTable.$inferSelect;
