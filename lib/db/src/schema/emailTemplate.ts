import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, emailScopeEnum } from "./_shared";
import { emailCampaign } from "./emailCampaign";

export const emailTemplate = pgTable("email_template", {
  id: idPk("tpl"),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  variables: jsonb("variables"),
  scope: emailScopeEnum("scope").notNull().default("SYSTEM"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const emailTemplateRelations = relations(emailTemplate, ({ many }) => ({
  campaigns: many(emailCampaign),
}));

export const insertEmailTemplateSchema = createInsertSchema(emailTemplate);
export const selectEmailTemplateSchema = createSelectSchema(emailTemplate);
export type EmailTemplate = typeof emailTemplate.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
