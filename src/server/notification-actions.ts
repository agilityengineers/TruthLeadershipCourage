"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";

export async function markAllNotificationsRead() {
  const principal = await requirePrincipal();
  await db.notification.updateMany({
    where: { userId: principal.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/portal");
  revalidatePath("/trainer");
  revalidatePath("/admin");
  return { ok: true as const };
}
