import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, seatStatusEnum } from "./_shared";
import { cohort } from "./cohort";
import { company } from "./company";
import { user } from "./user";
import { enrollment } from "./enrollment";

export const seat = pgTable("seat", {
  id: idPk("seat"),
  cohortId: text("cohort_id")
    .notNull()
    .references(() => cohort.id),
  companyId: text("company_id").references(() => company.id),
  status: seatStatusEnum("status").notNull().default("AVAILABLE"),
  assignedUserId: text("assigned_user_id").references(() => user.id),
  purchasedById: text("purchased_by_id").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const seatRelations = relations(seat, ({ one }) => ({
  cohort: one(cohort, { fields: [seat.cohortId], references: [cohort.id] }),
  company: one(company, { fields: [seat.companyId], references: [company.id] }),
  enrollment: one(enrollment),
}));

export const insertSeatSchema = createInsertSchema(seat);
export const selectSeatSchema = createSelectSchema(seat);
export type Seat = typeof seat.$inferSelect;
export type InsertSeat = z.infer<typeof insertSeatSchema>;
