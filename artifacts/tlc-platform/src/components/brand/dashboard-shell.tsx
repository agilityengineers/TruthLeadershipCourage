import { Link, useLocation } from "wouter";
import { Logo } from "./logo";
import { Avatar } from "@/components/ui/avatar";
import { SignOut } from "./sign-out";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  badge?: number;
};

export type ShellUser = {
  name: string;
  caption: string;
  initials: string;
  avatarColor?: string;
  avatarTextColor?: string;
};

interface DashboardShellProps {
  area: "participant" | "trainer" | "admin" | "company";
  roleLabel: string;
  sidebarColor: string;
  activeItemColor: string;
  nav: NavItem[];
  user?: ShellUser;
  showUserCard?: boolean;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  roleLabel,
  sidebarColor,
  activeItemColor,
  nav,
  user,
  showUserCard = true,
  topbar,
  children,
}: DashboardShellProps) {
  const [pathname] = useLocation();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[236px_1fr] bg-page">
      {/* Sidebar */}
      <aside
        className="flex flex-col gap-1 px-3.5 py-5 text-[#cdd0e8]"
        style={{ background: sidebarColor }}
      >
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-1">
          <Logo size={30} variant="dark" withWordmark subtitle={roleLabel} href={undefined} />
        </div>

        {showUserCard && user && (
          <div className="mb-3 flex items-center gap-2.5 rounded-[10px] bg-white/10 px-3 py-2.5">
            <Avatar
              label={user.initials}
              size={34}
              style={{
                background: user.avatarColor ?? "#b8d8e6",
                color: user.avatarTextColor ?? "#262161",
              }}
            />
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold text-white">{user.name}</div>
              <div className="truncate text-[10.5px] font-medium text-[#9b98ca]">{user.caption}</div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-[9px] px-3 py-2.5 transition-colors",
                  active ? "text-white" : "hover:bg-white/5",
                )}
                style={active ? { background: activeItemColor } : undefined}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-[7px] w-[7px] rounded-[2px]"
                    style={{ background: active ? "#b8d8e6" : "#4a4577" }}
                  />
                  <span className={cn("text-[13px]", active ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                </span>
                {item.badge ? (
                  <span className="rounded-pill bg-eq px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-2">
          <SignOut />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-3.5 border-b border-hair-1 bg-white px-[clamp(18px,3vw,30px)] py-3.5">
          {topbar}
        </div>
        <div className="p-[clamp(18px,3vw,30px)]">{children}</div>
      </div>
    </div>
  );
}
