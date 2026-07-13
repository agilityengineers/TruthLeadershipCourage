import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, updatedAt, partnerStatusEnum } from "./_shared";
import { cohort } from "./cohort";
import { enrollment } from "./enrollment";
import { user } from "./user";

/**
 * Accountability-partner pairing within a cohort, chosen by the first
 * Practice Session. The home screen shows only presence signals derived from
 * this link (name, practiced-this-week) — never the partner's writing.
 */
export const partnerLink = pgTable("partner_link", {
  id: idPk("plk"),
  cohortId: text("cohort_id")
    .notNull()
    .references(() => cohort.id),
  enrollmentAId: text("enrollment_a_id")
    .notNull()
    .references(() => enrollment.id),
  enrollmentBId: text("enrollment_b_id")
    .notNull()
    .references(() => enrollment.id),
  status: partnerStatusEnum("status").notNull().default("ACTIVE"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const partnerLinkRelations = relations(partnerLink, ({ one }) => ({
  cohort: one(cohort, { fields: [partnerLink.cohortId], references: [cohort.id] }),
  enrollmentA: one(enrollment, {
    fields: [partnerLink.enrollmentAId],
    references: [enrollment.id],
    relationName: "partnerA",
  }),
  enrollmentB: one(enrollment, {
    fields: [partnerLink.enrollmentBId],
    references: [enrollment.id],
    relationName: "partnerB",
  }),
  creator: one(user, { fields: [partnerLink.createdBy], references: [user.id] }),
}));

export const insertPartnerLinkSchema = createInsertSchema(partnerLink);
export const selectPartnerLinkSchema = createSelectSchema(partnerLink);
export type PartnerLink = typeof partnerLink.$inferSelect;
export type InsertPartnerLink = z.infer<typeof insertPartnerLinkSchema>;
