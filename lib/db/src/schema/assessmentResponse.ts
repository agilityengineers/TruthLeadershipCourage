import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { assessment } from "./assessment";
import { user } from "./user";
import { answerItem } from "./answerItem";

export const assessmentResponse = pgTable("assessment_response", {
  id: idPk("resp"),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessment.id),
  userId: text("user_id").references(() => user.id),
  leadEmail: text("lead_email"),
  leadName: text("lead_name"),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  snapshot: jsonb("snapshot"),
  createdAt: createdAt(),
});

export const assessmentResponseRelations = relations(assessmentResponse, ({ one, many }) => ({
  assessment: one(assessment, {
    fields: [assessmentResponse.assessmentId],
    references: [assessment.id],
  }),
  user: one(user, { fields: [assessmentResponse.userId], references: [user.id] }),
  answers: many(answerItem),
}));

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponse);
export const selectAssessmentResponseSchema = createSelectSchema(assessmentResponse);
export type AssessmentResponse = typeof assessmentResponse.$inferSelect;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
