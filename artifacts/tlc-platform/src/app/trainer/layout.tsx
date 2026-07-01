import { Link } from "wouter";
import { requireRole } from "@/lib/session";
import {
  useGetMe,
  useGetTrainerOverview,
  useGetUnreadMessageCount,
} from "@workspace/api-client-react";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";
import { Button } from "@/components/ui/button";
import { NotificationBellServer } from "@/components/notifications/bell-server";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const principal = requireRole("TRAINER", "ADMIN");

  const { data: user } = useGetMe();
  const { data: overview } = useGetTrainerOverview();
  const { data: unread } = useGetUnreadMessageCount();

  const cohort = overview?.cohort ?? null;
  const week = overview?.week ?? null;
  const unreadMessages = unread?.count ?? 0;

  const nav: NavItem[] = [
    { label: "Cohort Overview", href: "/trainer" },
    { label: "Participants", href: "/trainer/participants" },
    { label: "Resources", href: "/trainer/resources" },
    { label: "Events & Sessions", href: "/trainer/events" },
    { label: "Messages", href: "/trainer/messages", badge: unreadMessages || undefined },
  ];

  return (
    <DashboardShell
      area="trainer"
      roleLabel="TRAINER"
      sidebarColor="#16142b"
      activeItemColor="#2c2752"
      nav={nav}
      user={{
        name: user?.name ?? "Trainer",
        caption: user?.title ?? "Lead Trainer",
        initials: initials(user?.name),
        avatarColor: "#662d91",
        avatarTextColor: "#fff",
      }}
      topbar={
        <>
          <div>
            <div className="label-caps">Trainer Workspace</div>
            <div className="mt-0.5 font-display text-[15px] text-ink">
              {cohort ? `${cohort.name} Cohort${week ? ` · Week ${week}` : ""}` : "No active cohort"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm">
              <Link href="/trainer/events">+ New event</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/trainer/messages">Message cohort</Link>
            </Button>
            <NotificationBellServer userId={principal.id} />
          </div>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
