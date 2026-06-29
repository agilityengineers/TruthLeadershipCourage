import { useSearch } from "wouter";
import { requireRole } from "@/lib/session";
import { getThreadsForUser, getThread } from "@/server/chat-data";
import { markThreadRead } from "@/server/chat-actions";
import { ChatView } from "@/components/chat/chat-view";

export default function PortalMessagesPage() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const threads = getThreadsForUser(principal.id);
  const t = new URLSearchParams(useSearch()).get("t") ?? undefined;
  const activeId = t ?? threads[0]?.id;

  const thread = activeId ? getThread(activeId, principal.id) : null;
  if (thread) markThreadRead(thread.id);

  return (
    <ChatView
      basePath="/portal/messages"
      currentUserId={principal.id}
      threads={threads}
      active={thread ? { id: thread.id, title: threadTitle(thread, principal.id), type: thread.type } : null}
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

function threadTitle(
  thread: NonNullable<Awaited<ReturnType<typeof getThread>>>,
  userId: string,
) {
  if (thread.type === "COHORT_CHANNEL") return thread.title ?? `${thread.cohort?.name ?? "Cohort"} channel`;
  const others = thread.members.filter((m) => m.userId !== userId).map((m) => m.user.name);
  return others.join(", ") || "Direct message";
}
