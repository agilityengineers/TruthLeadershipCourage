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

export default function TrainerMessagesPage() {
  const principal = requireRole("TRAINER", "ADMIN");
  const { data: threads = [] } = useListThreads();
  const t = new URLSearchParams(useSearch()).get("t") ?? undefined;
  const activeId = t ?? threads[0]?.id;

  const { data: thread } = useGetThread(activeId ?? "", { oversight: true });
  const markRead = useMarkThreadRead();

  useEffect(() => {
    if (thread) markRead.mutate({ id: thread.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          senderName: m.senderName ?? null,
          createdAt: m.createdAt,
        })) ?? []
      }
    />
  );
}

function titleFor(thread: ThreadDetail, userId: string) {
  if (thread.type === "COHORT_CHANNEL") return thread.title ?? `${thread.cohort?.name ?? "Cohort"} channel`;
  const others = thread.members.filter((m) => m.userId !== userId).map((m) => m.user.name);
  return others.join(", ") || "Direct message";
}
