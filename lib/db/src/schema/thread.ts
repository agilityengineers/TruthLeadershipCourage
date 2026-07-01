import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, threadTypeEnum } from "./_shared";
import { cohort } from "./cohort";
import { threadMember } from "./threadMember";
import { message } from "./message";

export const thread = pgTable("thread", {
  id: idPk("thr"),
  type: threadTypeEnum("type").notNull(),
  cohortId: text("cohort_id").references(() => cohort.id),
  title: text("title"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const threadRelations = relations(thread, ({ one, many }) => ({
  cohort: one(cohort, { fields: [thread.cohortId], references: [cohort.id] }),
  members: many(threadMember),
  messages: many(message),
}));

export const insertThreadSchema = createInsertSchema(thread);
export const selectThreadSchema = createSelectSchema(thread);
export type Thread = typeof thread.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;
