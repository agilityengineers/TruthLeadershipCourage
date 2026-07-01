import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { assessmentResponse } from "./assessmentResponse";
import { question } from "./question";

export const answerItem = pgTable("answer_item", {
  id: idPk("ans"),
  responseId: text("response_id")
    .notNull()
    .references(() => assessmentResponse.id),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id),
  value: integer("value").notNull(),
  createdAt: createdAt(),
});

export const answerItemRelations = relations(answerItem, ({ one }) => ({
  response: one(assessmentResponse, {
    fields: [answerItem.responseId],
    references: [assessmentResponse.id],
  }),
  question: one(question, { fields: [answerItem.questionId], references: [question.id] }),
}));

export const insertAnswerItemSchema = createInsertSchema(answerItem);
export const selectAnswerItemSchema = createSelectSchema(answerItem);
export type AnswerItem = typeof answerItem.$inferSelect;
export type InsertAnswerItem = z.infer<typeof insertAnswerItemSchema>;
