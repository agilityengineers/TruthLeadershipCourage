import { db } from "@/lib/db";

/** Threads the user belongs to (1:1 direct + cohort channels), newest activity first. */
export function getThreadsForUser(userId: string) {
  const memberships = db.threadMember.findMany({
    where: { userId },
    include: {
      thread: {
        include: {
          cohort: true,
          members: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
        },
      },
    },
  });

  const threads = memberships.map((m) => {
    const t = m.thread;
    const others = t.members.filter((mm) => mm.userId !== userId).map((mm) => mm.user);
    const title =
      t.type === "COHORT_CHANNEL"
        ? (t.title ?? `${t.cohort?.name ?? "Cohort"} channel`)
        : others.map((u) => u.name).join(", ") || "Direct message";
    return {
      id: t.id,
      type: t.type,
      title,
      lastMessage: t.messages[0]
        ? { body: t.messages[0].body, at: t.messages[0].createdAt, sender: t.messages[0].sender.name }
        : null,
      lastReadAt: m.lastReadAt,
    };
  });

  threads.sort((a, b) => {
    const at = a.lastMessage?.at?.getTime() ?? 0;
    const bt = b.lastMessage?.at?.getTime() ?? 0;
    return bt - at;
  });
  return threads;
}

/** Full thread with messages, asserting membership (oversight roles bypass). */
export function getThread(threadId: string, userId: string, oversight = false) {
  const member = db.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!member && !oversight) return null;

  const thread = db.thread.findUnique({
    where: { id: threadId },
    include: {
      cohort: true,
      members: { include: { user: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });
  return thread;
}
