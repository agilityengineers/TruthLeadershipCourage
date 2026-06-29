import { useEffect } from "react";
import { useSearch } from "wouter";
import { requireRole } from "@/lib/session";
import { getThreadsForUser, getThread } from "@/server/chat-data";
import { markThreadRead } from "@/server/chat-actions";
import { ChatView } from "@/components/chat/chat-view";

export default function TrainerMessagesPage() {
  const principal = requireRole("TRAINER", "ADMIN");
  const threads = getThreadsForUser(principal.id);
  const params = new URLSearchParams(useSearch());
  const t = params.get("t") ?? undefined;
  const activeId = t ?? threads[0]?.id;

  const thread = activeId ? getThread(activeId, principal.id) : null;
  useEffect(() => {
    if (thread) markThreadRead(thread.id);
  }, [thread?.id]);

  return (
    <ChatView
      basePath="/trainer/messages"
      currentUserId={principal.id}
      threads={threads}
      active={thread ? { id: thread.id, title: titleFor(thread, principal.id), type: thread.type } : null}
      messages={
        thread?.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          senderName: m.sender.name,
          createdAt: m.createdAt,
        })) ?? []
      }
    />
  );
}

function titleFor(thread: NonNullable<ReturnType<typeof getThread>>, userId: string) {
  if (thread.type === "COHORT_CHANNEL") return thread.title ?? `${thread.cohort?.name ?? "Cohort"} channel`;
  const others = thread.members.filter((m) => m.userId !== userId).map((m) => m.user.name);
  return others.join(", ") || "Direct message";
}
