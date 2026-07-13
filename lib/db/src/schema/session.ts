import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { user } from "./user";

/**
 * Server-validated session. The lightweight demo login mints a row here and
 * returns `sessionToken`; the client sends it back as a bearer token so the
 * server can rebuild the principal on every request.
 */
export const session = pgTable("session", {
  id: idPk("sess"),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  /** Set when this session was minted by an admin impersonating `userId`. */
  impersonatorId: text("impersonator_id").references(() => user.id),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: createdAt(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const insertSessionSchema = createInsertSchema(session);
export const selectSessionSchema = createSelectSchema(session);
export type Session = typeof session.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
