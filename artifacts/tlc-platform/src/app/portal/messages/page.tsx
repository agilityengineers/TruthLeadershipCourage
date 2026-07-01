import { useEffect } from "react";
import { useSearch } from "wouter";
import { requireRole } from "@/lib/session";
import {
  useListThreads,
  useGetThread,
  useMarkThreadRead,
  type ThreadDetail,
} from "@workspace/api-client-react";
import { ChatView } from "@/components/chat/chat-view";

export default function PortalMessagesPage() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const { data: threads = [] } = useListThreads();
  const t = new URLSearchParams(useSearch()).get("t") ?? undefined;
  const activeId = t ?? threads[0]?.id;

  const { data: thread } = useGetThread(activeId ?? "");
  const markRead = useMarkThreadRead();

  useEffect(() => {
    if (thread) markRead.mutate({ id: thread.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

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
          senderName: m.senderName ?? null,
          createdAt: m.createdAt,
        })) ?? []
      }
    />
  );
}

function threadTitle(thread: ThreadDetail, userId: string) {
  if (thread.type === "COHORT_CHANNEL") return thread.title ?? `${thread.cohort?.name ?? "Cohort"} channel`;
  const others = thread.members.filter((m) => m.userId !== userId).map((m) => m.user.name);
  return others.join(", ") || "Direct message";
}
