import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, couponTypeEnum } from "./_shared";
import { payment } from "./payment";

export const coupon = pgTable("coupon", {
  id: idPk("cpn"),
  code: text("code").notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  cohortId: text("cohort_id"),
  maxRedemptions: integer("max_redemptions"),
  redeemedCount: integer("redeemed_count").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const couponRelations = relations(coupon, ({ many }) => ({
  payments: many(payment),
}));

export const insertCouponSchema = createInsertSchema(coupon);
export const selectCouponSchema = createSelectSchema(coupon);
export type Coupon = typeof coupon.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
