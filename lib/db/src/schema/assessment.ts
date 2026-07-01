import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { program } from "./program";
import { question } from "./question";
import { assessmentResponse } from "./assessmentResponse";

export const assessment = pgTable("assessment", {
  id: idPk("asmt"),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  title: text("title").notNull(),
  createdAt: createdAt(),
});

export const assessmentRelations = relations(assessment, ({ one, many }) => ({
  program: one(program, { fields: [assessment.programId], references: [program.id] }),
  questions: many(question),
  responses: many(assessmentResponse),
}));

export const insertAssessmentSchema = createInsertSchema(assessment);
export const selectAssessmentSchema = createSelectSchema(assessment);
export type Assessment = typeof assessment.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
