import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { thread } from "./thread";
import { user } from "./user";

export const message = pgTable("message", {
  id: idPk("msg"),
  threadId: text("thread_id")
    .notNull()
    .references(() => thread.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id),
  body: text("body").notNull(),
  attachments: jsonb("attachments"),
  createdAt: createdAt(),
});

export const messageRelations = relations(message, ({ one }) => ({
  thread: one(thread, { fields: [message.threadId], references: [thread.id] }),
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}));

export const insertMessageSchema = createInsertSchema(message);
export const selectMessageSchema = createSelectSchema(message);
export type Message = typeof message.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
