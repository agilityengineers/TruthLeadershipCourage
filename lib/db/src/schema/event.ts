import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, eventTypeEnum } from "./_shared";
import { cohort } from "./cohort";
import { module } from "./module";
import { coachingBooking } from "./coachingBooking";

export const event = pgTable("event", {
  id: idPk("ev"),
  cohortId: text("cohort_id")
    .notNull()
    .references(() => cohort.id),
  moduleId: text("module_id").references(() => module.id),
  type: eventTypeEnum("type").notNull(),
  title: text("title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
  joinUrl: text("join_url"),
  location: text("location"),
  status: text("status").notNull().default("scheduled"),
  weekNo: integer("week_no"),
  createdAt: createdAt(),
});

export const eventRelations = relations(event, ({ one, many }) => ({
  cohort: one(cohort, { fields: [event.cohortId], references: [cohort.id] }),
  module: one(module, { fields: [event.moduleId], references: [module.id] }),
  bookings: many(coachingBooking),
}));

export const insertEventSchema = createInsertSchema(event);
export const selectEventSchema = createSelectSchema(event);
export type Event = typeof event.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
