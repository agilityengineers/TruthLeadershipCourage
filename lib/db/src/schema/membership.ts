import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt } from "./_shared";
import { user } from "./user";
import { company } from "./company";

export const membership = pgTable("membership", {
  id: idPk("mem"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id),
  role: text("role"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const membershipRelations = relations(membership, ({ one }) => ({
  user: one(user, { fields: [membership.userId], references: [user.id] }),
  company: one(company, { fields: [membership.companyId], references: [company.id] }),
}));

export const insertMembershipSchema = createInsertSchema(membership);
export const selectMembershipSchema = createSelectSchema(membership);
export type Membership = typeof membership.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
