import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { safehousesTable } from "./safehouses";

export const residentsTable = pgTable("residents", {
  id: serial("id").primaryKey(),
  caseCode: text("case_code").notNull().unique(),
  safehouseId: integer("safehouse_id").references(() => safehousesTable.id),
  age: integer("age"),
  admissionDate: text("admission_date"),
  status: text("status").notNull().default("active"),
  riskLevel: text("risk_level").notNull().default("medium"),
  caseCategory: text("case_category"),
  referralSource: text("referral_source"),
  reintegrationProgress: integer("reintegration_progress").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResidentSchema = createInsertSchema(residentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type Resident = typeof residentsTable.$inferSelect;

export const processRecordingsTable = pgTable("process_recordings", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id),
  sessionDate: text("session_date").notNull(),
  counselorName: text("counselor_name"),
  sessionType: text("session_type"),
  emotionalState: text("emotional_state"),
  notes: text("notes"),
  interventionNotes: text("intervention_notes"),
  followUpActions: text("follow_up_actions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProcessRecordingSchema = createInsertSchema(processRecordingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProcessRecording = z.infer<typeof insertProcessRecordingSchema>;
export type ProcessRecording = typeof processRecordingsTable.$inferSelect;

export const homeVisitationsTable = pgTable("home_visitations", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id),
  visitDate: text("visit_date").notNull(),
  visitorName: text("visitor_name"),
  visitType: text("visit_type"),
  observations: text("observations"),
  safetyConcerns: text("safety_concerns"),
  followUpActions: text("follow_up_actions"),
  nextVisitDate: text("next_visit_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHomeVisitationSchema = createInsertSchema(homeVisitationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHomeVisitation = z.infer<typeof insertHomeVisitationSchema>;
export type HomeVisitation = typeof homeVisitationsTable.$inferSelect;

export const educationRecordsTable = pgTable("education_records", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id),
  programType: text("program_type"),
  institution: text("institution"),
  enrollmentDate: text("enrollment_date"),
  status: text("status"),
  progressNotes: text("progress_notes"),
  completionDate: text("completion_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEducationRecordSchema = createInsertSchema(educationRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducationRecord = z.infer<typeof insertEducationRecordSchema>;
export type EducationRecord = typeof educationRecordsTable.$inferSelect;

export const healthWellbeingRecordsTable = pgTable("health_wellbeing_records", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id),
  recordDate: text("record_date").notNull(),
  physicalHealthStatus: text("physical_health_status"),
  mentalHealthStatus: text("mental_health_status"),
  traumaScore: integer("trauma_score"),
  wellbeingScore: integer("wellbeing_score"),
  medicalNotes: text("medical_notes"),
  counselorNotes: text("counselor_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHealthWellbeingRecordSchema = createInsertSchema(healthWellbeingRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHealthWellbeingRecord = z.infer<typeof insertHealthWellbeingRecordSchema>;
export type HealthWellbeingRecord = typeof healthWellbeingRecordsTable.$inferSelect;

export const interventionPlansTable = pgTable("intervention_plans", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id),
  planDate: text("plan_date").notNull(),
  interventionType: text("intervention_type"),
  goals: text("goals"),
  strategies: text("strategies"),
  timeline: text("timeline"),
  status: text("status"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInterventionPlanSchema = createInsertSchema(interventionPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInterventionPlan = z.infer<typeof insertInterventionPlanSchema>;
export type InterventionPlan = typeof interventionPlansTable.$inferSelect;

export const incidentReportsTable = pgTable("incident_reports", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").references(() => residentsTable.id),
  safehouseId: integer("safehouse_id").references(() => safehousesTable.id),
  incidentDate: text("incident_date").notNull(),
  incidentType: text("incident_type"),
  severity: text("severity").notNull().default("low"),
  description: text("description"),
  actionsTaken: text("actions_taken"),
  reportedBy: text("reported_by"),
  resolved: text("resolved").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIncidentReportSchema = createInsertSchema(incidentReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncidentReport = z.infer<typeof insertIncidentReportSchema>;
export type IncidentReport = typeof incidentReportsTable.$inferSelect;
