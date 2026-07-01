import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";

/** NextAuth-style verification token (kept for schema parity; unused in demo). */
export const verificationToken = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

export const insertVerificationTokenSchema = createInsertSchema(verificationToken);
export const selectVerificationTokenSchema = createSelectSchema(verificationToken);
export type VerificationToken = typeof verificationToken.$inferSelect;
export type InsertVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
