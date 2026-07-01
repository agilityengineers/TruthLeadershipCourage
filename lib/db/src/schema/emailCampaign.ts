import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";
import { emailTemplate } from "./emailTemplate";
import { cohort } from "./cohort";
import { user } from "./user";

export const emailCampaign = pgTable("email_campaign", {
  id: idPk("camp"),
  templateId: text("template_id").references(() => emailTemplate.id),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  segment: jsonb("segment"),
  cohortId: text("cohort_id").references(() => cohort.id),
  sentById: text("sent_by_id").references(() => user.id),
  status: text("status").notNull().default("draft"),
  recipients: integer("recipients").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const emailCampaignRelations = relations(emailCampaign, ({ one }) => ({
  template: one(emailTemplate, {
    fields: [emailCampaign.templateId],
    references: [emailTemplate.id],
  }),
  cohort: one(cohort, { fields: [emailCampaign.cohortId], references: [cohort.id] }),
}));

export const insertEmailCampaignSchema = createInsertSchema(emailCampaign);
export const selectEmailCampaignSchema = createSelectSchema(emailCampaign);
export type EmailCampaign = typeof emailCampaign.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
