import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { initials } from "@/lib/utils";
import { DashboardShell, type NavItem } from "@/components/brand/dashboard-shell";
import { NotificationBellServer } from "@/components/notifications/bell-server";

/** Tier 3 — Company Viewer (read-only). Client managers watch their people. */
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireRole("COMPANY_VIEWER", "ADMIN");
  const user = await db.user.findUnique({
    where: { id: principal.id },
    include: { company: true },
  });

  const nav: NavItem[] = [
    { label: "Overview", href: "/company" },
    { label: "People", href: "/company/people" },
  ];

  return (
    <DashboardShell
      area="company"
      roleLabel="COMPANY VIEWER"
      sidebarColor="#1b1942"
      activeItemColor="#322c5c"
      nav={nav}
      user={{
        name: user?.name ?? "Viewer",
        caption: user?.company?.name ?? "Read-only",
        initials: initials(user?.name),
        avatarColor: "#b8860b",
        avatarTextColor: "#fff",
      }}
      topbar={
        <>
          <div>
            <div className="label-caps">Company Console · Read-only</div>
            <div className="mt-0.5 font-display text-[15px] text-ink">{user?.company?.name ?? "Your team"}</div>
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
