import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { user } from "./user";

/** NextAuth-style linked OAuth account (kept for schema parity; unused in demo). */
export const account = pgTable("account", {
  id: idPk("acct"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: createdAt(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const insertAccountSchema = createInsertSchema(account);
export const selectAccountSchema = createSelectSchema(account);
export type Account = typeof account.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
