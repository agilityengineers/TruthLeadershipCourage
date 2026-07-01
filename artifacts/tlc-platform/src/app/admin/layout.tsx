import { requireRole } from "@/lib/session";
import { useGetMe } from "@workspace/api-client-react";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";
import { NotificationBellServer } from "@/components/notifications/bell-server";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = requireRole("ADMIN");
  const { data: user } = useGetMe();

  const nav: NavItem[] = [
    { label: "Overview", href: "/admin" },
    { label: "Companies", href: "/admin/companies" },
    { label: "Cohorts", href: "/admin/cohorts" },
    { label: "Participants", href: "/admin/participants" },
    { label: "Trainers", href: "/admin/trainers" },
    { label: "Assessment", href: "/admin/assessment" },
    { label: "Site Content", href: "/admin/content" },
    { label: "Resources & Events", href: "/admin/resources" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Communications", href: "/admin/communications" },
    { label: "Billing", href: "/admin/billing" },
  ];

  return (
    <DashboardShell
      area="admin"
      roleLabel="ADMIN"
      sidebarColor="#0f0e22"
      activeItemColor="#26234a"
      nav={nav}
      user={{
        name: user?.name ?? "Admin",
        caption: "System administrator",
        initials: initials(user?.name),
        avatarColor: "#024794",
        avatarTextColor: "#fff",
      }}
      topbar={
        <>
          <div>
            <div className="label-caps">Admin Console</div>
            <div className="mt-0.5 font-display text-[15px] text-ink">System overview</div>
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
