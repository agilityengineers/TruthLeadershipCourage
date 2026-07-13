import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, pillarEnum, programSegmentEnum } from "./_shared";
import { program } from "./program";
import { resource } from "./resource";
import { event } from "./event";
import { moduleProgress } from "./moduleProgress";
import { liveItItem } from "./liveItItem";

export const module = pgTable("module", {
  id: idPk("mod"),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  pillar: pillarEnum("pillar").notNull(),
  order: integer("order").notNull(),
  weekNo: integer("week_no"),
  // ── Two-week heartbeat: which program segment the module sits in and the
  //    week offsets (1-based, from cohort start) of its two sessions. ──
  segment: programSegmentEnum("segment"),
  lessonWeekNo: integer("lesson_week_no"),
  practiceWeekNo: integer("practice_week_no"),
  title: text("title").notNull(),
  summary: text("summary"),
  // Shown on the home screen once the module's Live It stretch opens.
  anchorLine: text("anchor_line"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const moduleRelations = relations(module, ({ one, many }) => ({
  program: one(program, { fields: [module.programId], references: [program.id] }),
  resources: many(resource),
  events: many(event),
  progress: many(moduleProgress),
  liveItItems: many(liveItItem),
}));

export const insertModuleSchema = createInsertSchema(module);
export const selectModuleSchema = createSelectSchema(module);
export type Module = typeof module.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
