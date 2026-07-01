import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, bookingStatusEnum } from "./_shared";
import { enrollment } from "./enrollment";
import { user } from "./user";
import { event } from "./event";

export const coachingBooking = pgTable("coaching_booking", {
  id: idPk("bk"),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => enrollment.id),
  trainerId: text("trainer_id").references(() => user.id),
  eventId: text("event_id").references(() => event.id),
  slot: timestamp("slot", { withTimezone: true, mode: "date" }).notNull(),
  status: bookingStatusEnum("status").notNull().default("SCHEDULED"),
  notes: text("notes"),
  sequence: integer("sequence"),
  createdAt: createdAt(),
});

export const coachingBookingRelations = relations(coachingBooking, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [coachingBooking.enrollmentId],
    references: [enrollment.id],
  }),
  trainer: one(user, { fields: [coachingBooking.trainerId], references: [user.id] }),
  event: one(event, { fields: [coachingBooking.eventId], references: [event.id] }),
}));

export const insertCoachingBookingSchema = createInsertSchema(coachingBooking);
export const selectCoachingBookingSchema = createSelectSchema(coachingBooking);
export type CoachingBooking = typeof coachingBooking.$inferSelect;
export type InsertCoachingBooking = z.infer<typeof insertCoachingBookingSchema>;
