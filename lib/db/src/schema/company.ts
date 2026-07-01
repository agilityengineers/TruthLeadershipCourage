import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, companyStatusEnum } from "./_shared";
import { user } from "./user";
import { membership } from "./membership";
import { seat } from "./seat";
import { enrollment } from "./enrollment";
import { payment } from "./payment";
import { cohort } from "./cohort";

export const company = pgTable("company", {
  id: idPk("co"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  billingEmail: text("billing_email"),
  logoUrl: text("logo_url"),
  status: companyStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const companyRelations = relations(company, ({ many }) => ({
  users: many(user),
  memberships: many(membership),
  seats: many(seat),
  enrollments: many(enrollment),
  payments: many(payment),
  cohorts: many(cohort),
}));

export const insertCompanySchema = createInsertSchema(company);
export const selectCompanySchema = createSelectSchema(company);
export type Company = typeof company.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
