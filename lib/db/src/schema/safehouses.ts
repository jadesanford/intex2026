import { pgTable, serial, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const safehousesTable = pgTable("safehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  capacity: integer("capacity").notNull().default(20),
  status: text("status").notNull().default("active"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSafehouseSchema = createInsertSchema(safehousesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSafehouse = z.infer<typeof insertSafehouseSchema>;
export type Safehouse = typeof safehousesTable.$inferSelect;

export const safehouseMonthlyMetricsTable = pgTable("safehouse_monthly_metrics", {
  id: serial("id").primaryKey(),
  safehouseId: integer("safehouse_id").notNull().references(() => safehousesTable.id),
  month: text("month").notNull(),
  occupancy: integer("occupancy").notNull().default(0),
  newAdmissions: integer("new_admissions").notNull().default(0),
  reintegrations: integer("reintegrations").notNull().default(0),
  counselingSessions: integer("counseling_sessions").notNull().default(0),
  incidentCount: integer("incident_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSafehouseMonthlyMetricSchema = createInsertSchema(safehouseMonthlyMetricsTable).omit({ id: true, createdAt: true });
export type InsertSafehouseMonthlyMetric = z.infer<typeof insertSafehouseMonthlyMetricSchema>;
export type SafehouseMonthlyMetric = typeof safehouseMonthlyMetricsTable.$inferSelect;
