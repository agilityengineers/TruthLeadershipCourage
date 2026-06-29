"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, cn, formatDate } from "@/lib/utils";
import { sendMessage } from "@/server/chat-actions";
import { Hash, MessageSquare } from "lucide-react";

type ThreadSummary = {
  id: string;
  type: string;
  title: string;
  lastMessage: { body: string; at: Date; sender: string | null } | null;
};

type Msg = { id: string; body: string; senderId: string; senderName: string | null; createdAt: Date };

export function ChatView({
  threads,
  active,
  messages,
  currentUserId,
  basePath,
  readOnly = false,
}: {
  threads: ThreadSummary[];
  active: { id: string; title: string; type: string } | null;
  messages: Msg[];
  currentUserId: string;
  basePath: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, active?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !active) return;
    const body = draft;
    setDraft("");
    start(async () => {
      await sendMessage({ threadId: active.id, body });
      router.refresh();
    });
  }

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[460px] grid-cols-1 overflow-hidden rounded-card border border-hair-1 bg-white md:grid-cols-[280px_1fr]">
      {/* Thread list */}
      <div className="flex flex-col border-r border-hair-1">
        <div className="border-b border-hair-1 px-4 py-3">
          <div className="label-caps">Conversations</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`${basePath}?t=${t.id}`}
              className={cn(
                "flex items-start gap-2.5 border-b border-hair-3 px-4 py-3 transition-colors hover:bg-soft-1",
                active?.id === t.id && "bg-[#eef4fc]",
              )}
            >
              <span className="mt-0.5 text-muted-3">
                {t.type === "COHORT_CHANNEL" ? <Hash className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{t.title}</span>
                {t.lastMessage && (
                  <span className="block truncate text-[12px] text-muted-2">
                    {t.lastMessage.sender ? `${t.lastMessage.sender.split(" ")[0]}: ` : ""}
                    {t.lastMessage.body}
                  </span>
                )}
              </span>
            </Link>
          ))}
          {threads.length === 0 && (
            <p className="px-4 py-6 text-[13px] text-muted">No conversations yet.</p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex min-w-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-2.5 border-b border-hair-1 px-5 py-3.5">
              <span className="text-muted-3">
                {active.type === "COHORT_CHANNEL" ? <Hash className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </span>
              <div className="font-display text-[16px] text-ink">{active.title}</div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((m) => {
                const mine = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                    <Avatar
                      label={initials(m.senderName)}
                      size={30}
                      style={mine ? { background: "#024794", color: "#fff" } : undefined}
                    />
                    <div className={cn("max-w-[70%]", mine && "text-right")}>
                      <div className="mb-0.5 text-[11px] text-muted-3">
                        {mine ? "You" : m.senderName} · {formatDate(m.createdAt, { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div
                        className={cn(
                          "inline-block rounded-[12px] px-3.5 py-2 text-[14px] leading-snug",
                          mine ? "bg-eq text-white" : "bg-soft-1 text-ink",
                        )}
                      >
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            {!readOnly ? (
              <form onSubmit={submit} className="flex items-center gap-2.5 border-t border-hair-1 px-4 py-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="h-11 flex-1 rounded-[9px] border border-[#e0e4ee] bg-white px-3.5 text-sm focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                />
                <Button type="submit" disabled={pending || !draft.trim()}>
                  Send
                </Button>
              </form>
            ) : (
              <div className="border-t border-hair-1 px-4 py-3 text-[12px] text-muted-3">
                Oversight view — read only.
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-muted">
            Select a conversation to start.
          </div>
        )}
      </div>
    </div>
  );
}
