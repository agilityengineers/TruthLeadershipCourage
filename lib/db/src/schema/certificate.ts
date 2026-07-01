import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { enrollment } from "./enrollment";

export const certificate = pgTable("certificate", {
  id: idPk("cert"),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => enrollment.id)
    .unique(),
  serial: text("serial").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  createdAt: createdAt(),
});

export const certificateRelations = relations(certificate, ({ one }) => ({
  enrollment: one(enrollment, {
    fields: [certificate.enrollmentId],
    references: [enrollment.id],
  }),
}));

export const insertCertificateSchema = createInsertSchema(certificate);
export const selectCertificateSchema = createSelectSchema(certificate);
export type Certificate = typeof certificate.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
