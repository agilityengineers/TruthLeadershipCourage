import { db } from "./db";
import type { NotificationType } from "@prisma/client";

export async function notify(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}) {
  return db.notification.create({ data: { channel: "in_app", ...args } });
}

export async function notifyMany(
  userIds: string[],
  base: { type: NotificationType; title: string; body?: string; href?: string },
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, channel: "in_app", ...base })),
  });
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
