import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, progressStatusEnum } from "./_shared";
import { enrollment } from "./enrollment";
import { module } from "./module";

export const moduleProgress = pgTable("module_progress", {
  id: idPk("mp"),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => enrollment.id),
  weekNo: integer("week_no").notNull(),
  moduleId: text("module_id").references(() => module.id),
  status: progressStatusEnum("status").notNull().default("LOCKED"),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
});

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [moduleProgress.enrollmentId],
    references: [enrollment.id],
  }),
  module: one(module, { fields: [moduleProgress.moduleId], references: [module.id] }),
}));

export const insertModuleProgressSchema = createInsertSchema(moduleProgress);
export const selectModuleProgressSchema = createSelectSchema(moduleProgress);
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = z.infer<typeof insertModuleProgressSchema>;
