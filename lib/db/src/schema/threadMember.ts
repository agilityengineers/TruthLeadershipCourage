import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt } from "./_shared";
import { thread } from "./thread";
import { user } from "./user";

export const threadMember = pgTable(
  "thread_member",
  {
    id: idPk("tm"),
    threadId: text("thread_id")
      .notNull()
      .references(() => thread.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    lastReadAt: timestamp("last_read_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => ({
    threadUserUnique: unique("thread_member_thread_user_unique").on(t.threadId, t.userId),
  }),
);

export const threadMemberRelations = relations(threadMember, ({ one }) => ({
  thread: one(thread, { fields: [threadMember.threadId], references: [thread.id] }),
  user: one(user, { fields: [threadMember.userId], references: [user.id] }),
}));

export const insertThreadMemberSchema = createInsertSchema(threadMember);
export const selectThreadMemberSchema = createSelectSchema(threadMember);
export type ThreadMember = typeof threadMember.$inferSelect;
export type InsertThreadMember = z.infer<typeof insertThreadMemberSchema>;
