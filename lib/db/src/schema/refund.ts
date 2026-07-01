import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { payment } from "./payment";
import { user } from "./user";

export const refund = pgTable("refund", {
  id: idPk("ref"),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payment.id),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("processed"),
  externalId: text("external_id"),
  processedById: text("processed_by_id").references(() => user.id),
  createdAt: createdAt(),
});

export const refundRelations = relations(refund, ({ one }) => ({
  payment: one(payment, { fields: [refund.paymentId], references: [payment.id] }),
}));

export const insertRefundSchema = createInsertSchema(refund);
export const selectRefundSchema = createSelectSchema(refund);
export type Refund = typeof refund.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
