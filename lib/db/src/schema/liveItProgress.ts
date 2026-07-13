import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";
import { enrollment } from "./enrollment";
import { liveItItem } from "./liveItItem";

/**
 * One participant's state for one Live It item: checked ("Lived it") plus the
 * one-line noticing that opens when they check it. The note is the
 * participant's private writing — never shown to partners, trainers, or
 * company viewers. Unchecked items carry no state at all (no row).
 */
export const liveItProgress = pgTable(
  "live_it_progress",
  {
    id: idPk("lip"),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollment.id),
    itemId: text("item_id")
      .notNull()
      .references(() => liveItItem.id),
    checkedAt: timestamp("checked_at", { withTimezone: true, mode: "date" }),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    enrollmentItemUnique: unique("live_it_progress_enrollment_item_unique").on(
      t.enrollmentId,
      t.itemId,
    ),
  }),
);

export const liveItProgressRelations = relations(liveItProgress, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [liveItProgress.enrollmentId],
    references: [enrollment.id],
  }),
  item: one(liveItItem, { fields: [liveItProgress.itemId], references: [liveItItem.id] }),
}));

export const insertLiveItProgressSchema = createInsertSchema(liveItProgress);
export const selectLiveItProgressSchema = createSelectSchema(liveItProgress);
export type LiveItProgress = typeof liveItProgress.$inferSelect;
export type InsertLiveItProgress = z.infer<typeof insertLiveItProgressSchema>;
