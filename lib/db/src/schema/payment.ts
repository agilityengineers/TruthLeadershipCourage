import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, paymentProcessorEnum, paymentStatusEnum } from "./_shared";
import { enrollment } from "./enrollment";
import { company } from "./company";
import { coupon } from "./coupon";
import { refund } from "./refund";

export const payment = pgTable("payment", {
  id: idPk("pay"),
  enrollmentId: text("enrollment_id").references(() => enrollment.id),
  companyId: text("company_id").references(() => company.id),
  processor: paymentProcessorEnum("processor").notNull().default("STRIPE"),
  externalId: text("external_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  couponId: text("coupon_id").references(() => coupon.id),
  raw: jsonb("raw"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const paymentRelations = relations(payment, ({ one, many }) => ({
  enrollment: one(enrollment, { fields: [payment.enrollmentId], references: [enrollment.id] }),
  company: one(company, { fields: [payment.companyId], references: [company.id] }),
  coupon: one(coupon, { fields: [payment.couponId], references: [coupon.id] }),
  refunds: many(refund),
}));

export const insertPaymentSchema = createInsertSchema(payment);
export const selectPaymentSchema = createSelectSchema(payment);
export type Payment = typeof payment.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
