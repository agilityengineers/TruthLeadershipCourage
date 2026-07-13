import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, cohortStatusEnum } from "./_shared";
import { program } from "./program";
import { user } from "./user";
import { company } from "./company";
import { enrollment } from "./enrollment";
import { event } from "./event";
import { seat } from "./seat";
import { resource } from "./resource";
import { thread } from "./thread";
import { waitlistEntry } from "./waitlistEntry";
import { emailCampaign } from "./emailCampaign";

export const cohort = pgTable("cohort", {
  id: idPk("coh"),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true, mode: "date" }).notNull(),
  // ── The three phases every cohort runs through: Session 1 → Inter-session →
  //    Session 2. Nullable so cohorts created before this existed still load. ──
  session1StartDate: timestamp("session1_start_date", { withTimezone: true, mode: "date" }),
  session1EndDate: timestamp("session1_end_date", { withTimezone: true, mode: "date" }),
  intersessionStartDate: timestamp("intersession_start_date", { withTimezone: true, mode: "date" }),
  intersessionEndDate: timestamp("intersession_end_date", { withTimezone: true, mode: "date" }),
  session2StartDate: timestamp("session2_start_date", { withTimezone: true, mode: "date" }),
  session2EndDate: timestamp("session2_end_date", { withTimezone: true, mode: "date" }),
  sessionDay: text("session_day"),
  sessionTime: text("session_time"),
  timezone: text("timezone"),
  price: integer("price").notNull().default(0),
  currency: text("currency").notNull().default("usd"),
  capacity: integer("capacity").notNull().default(0),
  status: cohortStatusEnum("status").notNull().default("DRAFT"),
  isPrivate: boolean("is_private").notNull().default(false),
  trainerId: text("trainer_id").references(() => user.id),
  companyId: text("company_id").references(() => company.id),
  // ── Public landing-page content (all optional; the page falls back to
  //    program-level copy when a cohort doesn't override it). ──
  tagline: text("tagline"),
  description: text("description"),
  heroImageUrl: text("hero_image_url"),
  format: text("format").notNull().default("online"),
  location: text("location"),
  enrollByDate: timestamp("enroll_by_date", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cohortRelations = relations(cohort, ({ one, many }) => ({
  program: one(program, { fields: [cohort.programId], references: [program.id] }),
  trainer: one(user, { fields: [cohort.trainerId], references: [user.id] }),
  company: one(company, { fields: [cohort.companyId], references: [company.id] }),
  enrollments: many(enrollment),
  events: many(event),
  seats: many(seat),
  resources: many(resource),
  threads: many(thread),
  waitlist: many(waitlistEntry),
  campaigns: many(emailCampaign),
}));

export const insertCohortSchema = createInsertSchema(cohort);
export const selectCohortSchema = createSelectSchema(cohort);
export type Cohort = typeof cohort.$inferSelect;
export type InsertCohort = z.infer<typeof insertCohortSchema>;
