import { pgTable, serial, text, timestamp, integer, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supportersTable = pgTable("supporters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  type: text("type").notNull().default("individual"),
  country: text("country"),
  city: text("city"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSupporterSchema = createInsertSchema(supportersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupporter = z.infer<typeof insertSupporterSchema>;
export type Supporter = typeof supportersTable.$inferSelect;

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  supporterId: integer("supporter_id").references(() => supportersTable.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("IDR"),
  donationType: text("donation_type").notNull().default("cash"),
  campaign: text("campaign"),
  channel: text("channel"),
  donatedAt: text("donated_at").notNull(),
  receiptIssued: boolean("receipt_issued").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDonationSchema = createInsertSchema(donationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;
