import { pgTable, serial, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialMediaPostsTable = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  postDate: text("post_date").notNull(),
  contentType: text("content_type"),
  caption: text("caption"),
  reach: integer("reach"),
  likes: integer("likes"),
  shares: integer("shares"),
  donationsLinked: integer("donations_linked"),
  donationAmountLinked: doublePrecision("donation_amount_linked"),
  campaignTag: text("campaign_tag"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPostsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaPost = typeof socialMediaPostsTable.$inferSelect;

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull(),
  language: text("language").notNull().default("en"),
  isHelpRequest: text("is_help_request").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissionsTable).omit({ id: true, createdAt: true });
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
