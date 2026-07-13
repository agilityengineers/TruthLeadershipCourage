import { pgTable, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, reflectionKindEnum } from "./_shared";
import { enrollment } from "./enrollment";
import { module } from "./module";

/**
 * All structured participant writing, append-only. Every save inserts a new
 * row — the version history the design retains ("prior versions kept quietly
 * in the background") is the table itself; "current" is the latest row per
 * (enrollment, kind, promptKey). Rows are never updated or deleted while the
 * portal is open, and they are never exposed to trainer/company/admin reads.
 */
export const reflection = pgTable(
  "reflection",
  {
    id: idPk("refl"),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollment.id),
    kind: reflectionKindEnum("kind").notNull(),
    // Distinguishes prompts within a kind, e.g. seed.best_day / seed.said_yes.
    promptKey: text("prompt_key"),
    // Set for module-scoped kinds (COMMITMENT, MODULE_CLOSING, MONDAY_MORNING).
    moduleId: text("module_id").references(() => module.id),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => ({
    byEnrollmentKind: index("reflection_enrollment_kind_idx").on(t.enrollmentId, t.kind),
  }),
);

export const reflectionRelations = relations(reflection, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [reflection.enrollmentId],
    references: [enrollment.id],
  }),
  module: one(module, { fields: [reflection.moduleId], references: [module.id] }),
}));

export const insertReflectionSchema = createInsertSchema(reflection);
export const selectReflectionSchema = createSelectSchema(reflection);
export type Reflection = typeof reflection.$inferSelect;
export type InsertReflection = z.infer<typeof insertReflectionSchema>;
