import { requireRole } from "@/lib/session";
import { useGetMe, useGetUnreadMessageCount } from "@workspace/api-client-react";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";
import { NotificationBellServer } from "@/components/notifications/bell-server";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const { data: user } = useGetMe();
  const { data: unread } = useGetUnreadMessageCount();
  const unreadMessages = unread?.count ?? 0;

  const nav: NavItem[] = [
    { label: "Home", href: "/portal" },
    { label: "This Week", href: "/portal/this-week" },
    { label: "Materials", href: "/portal/materials" },
    { label: "Progress", href: "/portal/progress" },
    { label: "Workbook", href: "/portal/workbook" },
    { label: "Messages", href: "/portal/messages", badge: unreadMessages || undefined },
    { label: "Resource Library", href: "/portal/library" },
    { label: "Coaching", href: "/portal/coaching" },
    { label: "Account & Privacy", href: "/portal/settings" },
  ];

  const cohortName = user?.primaryCohortName ?? "TLC Program";

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
        <>
          <div>
            <div className="label-caps">Participant Portal</div>
            <div className="mt-0.5 font-display text-[15px] text-ink">Your TLC home</div>
          </div>
          <div className="ml-auto">
            <NotificationBellServer userId={principal.id} />
          </div>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
