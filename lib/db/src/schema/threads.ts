import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token").notNull().default(sql`gen_random_uuid()::text`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  status: text("status").notNull().default("open"),
  unreadForAdmin: integer("unread_for_admin").notNull().default(0),
  unreadForCustomer: integer("unread_for_customer").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const threadMessages = pgTable("thread_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  body: text("body").notNull(),
  photoUrl: text("photo_url"),
  smsMessageId: text("sms_message_id"),
  smsStatus: text("sms_status"),
  smsStatusUpdatedAt: timestamp("sms_status_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  accessToken: true,
  unreadForAdmin: true,
  unreadForCustomer: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export const insertThreadMessageSchema = createInsertSchema(threadMessages).omit({ id: true, createdAt: true });

export type Thread = typeof threads.$inferSelect;
export type ThreadMessage = typeof threadMessages.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type InsertThreadMessage = z.infer<typeof insertThreadMessageSchema>;
