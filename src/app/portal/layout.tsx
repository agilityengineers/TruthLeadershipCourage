import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { unreadCount } from "@/lib/notifications";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireRole("PARTICIPANT", "ADMIN");
  const user = await db.user.findUnique({
    where: { id: principal.id },
    include: { enrollments: { include: { cohort: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });

  // Unread direct/cohort messages → Messages badge.
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
  await unreadCount(principal.id); // (in-app notifications also tracked)

  const nav: NavItem[] = [
    { label: "Home", href: "/portal" },
    { label: "This Week", href: "/portal/this-week" },
    { label: "Materials", href: "/portal/materials" },
    { label: "Progress", href: "/portal/progress" },
    { label: "Workbook", href: "/portal/workbook" },
    { label: "Messages", href: "/portal/messages", badge: unreadMessages || undefined },
    { label: "Resource Library", href: "/portal/library" },
    { label: "Coaching", href: "/portal/coaching" },
  ];

  const cohortName = user?.enrollments[0]?.cohort.name ?? "TLC Program";

  return (
    <DashboardShell
      area="participant"
      roleLabel="PARTICIPANT"
      sidebarColor="#1b1942"
      activeItemColor="#322c5c"
      nav={nav}
      user={{
        name: user?.name ?? "Participant",
        caption: cohortName,
        initials: initials(user?.name),
      }}
      topbar={
        <div>
          <div className="label-caps">Participant Portal</div>
          <div className="mt-0.5 font-display text-[15px] text-ink">Your TLC home</div>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
