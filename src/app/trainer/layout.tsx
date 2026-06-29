import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { cohortScope } from "@/lib/scope";
import { currentWeek } from "@/lib/cohort";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireRole("TRAINER", "ADMIN");

  const user = await db.user.findUnique({ where: { id: principal.id } });

  // Primary running cohort (for the topbar context line).
  const cohort =
    (await db.cohort.findFirst({
      where: { AND: [cohortScope(principal), { status: "RUNNING" }] },
      orderBy: { startDate: "asc" },
    })) ??
    (await db.cohort.findFirst({
      where: cohortScope(principal),
      orderBy: { startDate: "asc" },
    }));

  // Unread direct/cohort messages → Messages badge (same approach as the portal layout).
  const myThreads = await db.threadMember.findMany({
    where: { userId: principal.id },
    select: { threadId: true, lastReadAt: true },
  });
  let unreadMessages = 0;
  for (const t of myThreads) {
    unreadMessages += await db.message.count({
      where: {
        threadId: t.threadId,
        senderId: { not: principal.id },
        createdAt: t.lastReadAt ? { gt: t.lastReadAt } : undefined,
      },
    });
  }

  const nav: NavItem[] = [
    { label: "Cohort Overview", href: "/trainer" },
    { label: "Participants", href: "/trainer/participants" },
    { label: "Resources", href: "/trainer/resources" },
    { label: "Events & Sessions", href: "/trainer/events" },
    { label: "Messages", href: "/trainer/messages", badge: unreadMessages || undefined },
  ];

  const week = cohort ? currentWeek(cohort.startDate, 24) : null;

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
          <div className="ml-auto flex gap-2.5">
            <Button asChild variant="outline" size="sm">
              <Link href="/trainer/events">+ New event</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/trainer/messages">Message cohort</Link>
            </Button>
          </div>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
