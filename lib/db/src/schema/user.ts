import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, roleEnum } from "./_shared";
import { company } from "./company";
import { membership } from "./membership";
import { enrollment } from "./enrollment";
import { cohort } from "./cohort";
import { assessmentResponse } from "./assessmentResponse";
import { message } from "./message";
import { threadMember } from "./threadMember";
import { notification } from "./notification";
import { resource } from "./resource";
import { coachingBooking } from "./coachingBooking";
import { consentRecord } from "./consentRecord";
import { auditLog } from "./auditLog";
import { account } from "./account";
import { session } from "./session";

export const user = pgTable("user", {
  id: idPk("u"),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: roleEnum("role").notNull().default("PARTICIPANT"),
  status: text("status").notNull().default("active"),
  title: text("title"),
  phone: text("phone"),
  image: text("image"),
  passwordHash: text("password_hash"),
  companyId: text("company_id").references(() => company.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const userRelations = relations(user, ({ one, many }) => ({
  company: one(company, { fields: [user.companyId], references: [company.id] }),
  memberships: many(membership),
  enrollments: many(enrollment),
  trainerCohorts: many(cohort),
  assessmentResponses: many(assessmentResponse),
  sentMessages: many(message),
  threadMemberships: many(threadMember),
  notifications: many(notification),
  uploadedResources: many(resource),
  bookingsAsTrainer: many(coachingBooking),
  consents: many(consentRecord),
  auditLogs: many(auditLog),
  accounts: many(account),
  sessions: many(session),
}));

export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);
export type User = typeof user.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
