import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";

export async function markAllNotificationsRead() {
  const principal = await requirePrincipal();
  await db.notification.updateMany({
    where: { userId: principal.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true as const };
}
