import { db } from "@/lib/db";
import { NotificationBell } from "./bell";

/** Server wrapper: loads recent notifications for a user and renders the bell. */
export function NotificationBellServer({ userId }: { userId: string }) {
  const notifications = db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return <NotificationBell notifications={notifications} />;
}
