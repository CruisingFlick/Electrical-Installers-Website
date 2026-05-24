import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  suburb: text("suburb").notNull(),
  jobType: text("job_type").notNull(),
  description: text("description").notNull(),
  switchboardImageUrl: text("switchboard_image_url"),
  fasciImageUrl: text("fasci_image_url"),
  streetImageUrl: text("street_image_url"),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
