import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, waitlistStatusEnum } from "./_shared";
import { cohort } from "./cohort";
import { user } from "./user";

export const waitlistEntry = pgTable("waitlist_entry", {
  id: idPk("wl"),
  cohortId: text("cohort_id")
    .notNull()
    .references(() => cohort.id),
  userId: text("user_id").references(() => user.id),
  email: text("email").notNull(),
  name: text("name"),
  position: integer("position"),
  status: waitlistStatusEnum("status").notNull().default("WAITING"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const waitlistEntryRelations = relations(waitlistEntry, ({ one }) => ({
  cohort: one(cohort, { fields: [waitlistEntry.cohortId], references: [cohort.id] }),
}));

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntry);
export const selectWaitlistEntrySchema = createSelectSchema(waitlistEntry);
export type WaitlistEntry = typeof waitlistEntry.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
