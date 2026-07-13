import { pgTable, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, enrollmentStatusEnum } from "./_shared";
import { user } from "./user";
import { cohort } from "./cohort";
import { company } from "./company";
import { seat } from "./seat";
import { payment } from "./payment";
import { shipment } from "./shipment";
import { certificate } from "./certificate";
import { moduleProgress } from "./moduleProgress";
import { coachingBooking } from "./coachingBooking";
import { reflection } from "./reflection";
import { liveItProgress } from "./liveItProgress";

export const enrollment = pgTable(
  "enrollment",
  {
    id: idPk("enr"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohort.id),
    companyId: text("company_id").references(() => company.id),
    seatId: text("seat_id").references(() => seat.id),
    status: enrollmentStatusEnum("status").notNull().default("PENDING"),
    shippingAddress: jsonb("shipping_address"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    userCohortUnique: unique("enrollment_user_cohort_unique").on(t.userId, t.cohortId),
  }),
);

export const enrollmentRelations = relations(enrollment, ({ one, many }) => ({
  user: one(user, { fields: [enrollment.userId], references: [user.id] }),
  cohort: one(cohort, { fields: [enrollment.cohortId], references: [cohort.id] }),
  company: one(company, { fields: [enrollment.companyId], references: [company.id] }),
  seat: one(seat, { fields: [enrollment.seatId], references: [seat.id] }),
  payment: one(payment),
  shipment: one(shipment),
  certificate: one(certificate),
  moduleProgress: many(moduleProgress),
  bookings: many(coachingBooking),
  reflections: many(reflection),
  liveItProgress: many(liveItProgress),
}));

export const insertEnrollmentSchema = createInsertSchema(enrollment);
export const selectEnrollmentSchema = createSelectSchema(enrollment);
export type Enrollment = typeof enrollment.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
