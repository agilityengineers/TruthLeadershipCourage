import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { user } from "./user";

export const consentRecord = pgTable("consent_record", {
  id: idPk("con"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: text("type").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true, mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
});

export const consentRecordRelations = relations(consentRecord, ({ one }) => ({
  user: one(user, { fields: [consentRecord.userId], references: [user.id] }),
}));

export const insertConsentRecordSchema = createInsertSchema(consentRecord);
export const selectConsentRecordSchema = createSelectSchema(consentRecord);
export type ConsentRecord = typeof consentRecord.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
