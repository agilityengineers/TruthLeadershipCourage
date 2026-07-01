import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { idPk, createdAt, notificationTypeEnum } from "./_shared";
import { user } from "./user";

export const notification = pgTable("notification", {
  id: idPk("ntf"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: notificationTypeEnum("type").notNull().default("GENERIC"),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  channel: text("channel").notNull().default("in_app"),
  readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
});

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const insertNotificationSchema = createInsertSchema(notification);
export const selectNotificationSchema = createSelectSchema(notification);
export type Notification = typeof notification.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
