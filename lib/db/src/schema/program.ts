import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";
import { cohort } from "./cohort";
import { module } from "./module";
import { assessment } from "./assessment";
import { resource } from "./resource";

export const program = pgTable("program", {
  id: idPk("prog"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const programRelations = relations(program, ({ one, many }) => ({
  cohorts: many(cohort),
  modules: many(module),
  assessment: one(assessment),
  resources: many(resource),
}));

export const insertProgramSchema = createInsertSchema(program);
export const selectProgramSchema = createSelectSchema(program);
export type Program = typeof program.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
