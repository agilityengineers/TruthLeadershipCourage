import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, pillarEnum } from "./_shared";
import { program } from "./program";
import { resource } from "./resource";
import { event } from "./event";
import { moduleProgress } from "./moduleProgress";

export const module = pgTable("module", {
  id: idPk("mod"),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  pillar: pillarEnum("pillar").notNull(),
  order: integer("order").notNull(),
  weekNo: integer("week_no"),
  title: text("title").notNull(),
  summary: text("summary"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const moduleRelations = relations(module, ({ one, many }) => ({
  program: one(program, { fields: [module.programId], references: [program.id] }),
  resources: many(resource),
  events: many(event),
  progress: many(moduleProgress),
}));

export const insertModuleSchema = createInsertSchema(module);
export const selectModuleSchema = createSelectSchema(module);
export type Module = typeof module.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
