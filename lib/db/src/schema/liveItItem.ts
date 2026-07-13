import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";
import { module } from "./module";
import { liveItProgress } from "./liveItProgress";

/**
 * Live It checklist template: the workbook's "Between Sessions" practices for
 * one module. Scoped to a module, visible during that module's Live It
 * stretch, and never carried over.
 */
export const liveItItem = pgTable("live_it_item", {
  id: idPk("lii"),
  moduleId: text("module_id")
    .notNull()
    .references(() => module.id),
  order: integer("order").notNull(),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const liveItItemRelations = relations(liveItItem, ({ one, many }) => ({
  module: one(module, { fields: [liveItItem.moduleId], references: [module.id] }),
  progress: many(liveItProgress),
}));

export const insertLiveItItemSchema = createInsertSchema(liveItItem);
export const selectLiveItItemSchema = createSelectSchema(liveItItem);
export type LiveItItem = typeof liveItItem.$inferSelect;
export type InsertLiveItItem = z.infer<typeof insertLiveItItemSchema>;
