import { useState } from "react";
import { Link } from "wouter";
import { Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";

type Note = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export function NotificationBell({ notifications }: { notifications: Note[] }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const markAllRead = useMarkAllNotificationsRead();
  const unread = notifications.filter((n) => !n.readAt).length;

  function markRead() {
    void (async () => {
      await markAllRead.mutateAsync(undefined);
      qc.invalidateQueries();
    })();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-[9px] border border-hair-1 bg-white text-muted transition-colors hover:text-ink"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-eq px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-card border border-hair-1 bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-hair-3 px-4 py-3">
              <span className="text-[13px] font-semibold text-ink">Notifications</span>
              {unread > 0 && (
                <button onClick={markRead} className="text-[12px] font-semibold text-eq">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-[13px] text-muted">You're all caught up.</p>
              )}
              {notifications.map((n) => {
                const inner = (
                  <div
                    className={cn(
                      "border-b border-hair-3 px-4 py-3 last:border-0",
                      !n.readAt && "bg-[#f6f9fe]",
                    )}
                  >
                    <div className="text-[13px] font-semibold text-ink">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-[12px] leading-snug text-muted-2">{n.body}</div>}
                    <div className="mt-1 text-[11px] text-muted-3">
                      {formatDate(n.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
