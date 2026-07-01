import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, pillarEnum } from "./_shared";
import { assessment } from "./assessment";
import { answerItem } from "./answerItem";

export const question = pgTable("question", {
  id: idPk("q"),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessment.id),
  order: integer("order").notNull(),
  theme: text("theme").notNull(),
  pillar: pillarEnum("pillar").notNull(),
  color: text("color"),
  prompt: text("prompt").notNull(),
  benefit: text("benefit").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const questionRelations = relations(question, ({ one, many }) => ({
  assessment: one(assessment, { fields: [question.assessmentId], references: [assessment.id] }),
  answers: many(answerItem),
}));

export const insertQuestionSchema = createInsertSchema(question);
export const selectQuestionSchema = createSelectSchema(question);
export type Question = typeof question.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
