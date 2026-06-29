"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { notifyMany } from "@/lib/notifications";

/** Post a message to a thread the user is a member of. */
export async function sendMessage(input: { threadId: string; body: string }) {
  const { threadId, body } = z
    .object({ threadId: z.string(), body: z.string().min(1).max(5000) })
    .parse(input);
  const principal = await requirePrincipal();

  const member = await db.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId: principal.id } },
  });
  const isStaff = ["ADMIN", "SUPER_ADMIN"].includes(principal.role);
  if (!member && !isStaff) return { ok: false as const, error: "Not a member of this thread" };

  const message = await db.message.create({
    data: { threadId, senderId: principal.id, body },
  });
  await db.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  // Notify the other members.
  const others = await db.threadMember.findMany({
    where: { threadId, userId: { not: principal.id } },
    select: { userId: true },
  });
  await notifyMany(
    others.map((o) => o.userId),
    { type: "NEW_MESSAGE", title: "New message", body: body.slice(0, 80), href: "/portal/messages" },
  );

  revalidatePath("/portal/messages");
  revalidatePath("/trainer/messages");
  return { ok: true as const, id: message.id };
}

/** Mark a thread read up to now for the current user. */
export async function markThreadRead(threadId: string) {
  const principal = await requirePrincipal();
  await db.threadMember.updateMany({
    where: { threadId, userId: principal.id },
    data: { lastReadAt: new Date() },
  });
  return { ok: true as const };
}
