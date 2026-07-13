import { requireRole } from "@/lib/session";
import { useListUsers, useGetCompaniesData } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AddUserDialog,
  EditUserDialog,
  DeleteUserButton,
  ImpersonateUserButton,
} from "@/components/admin/user-dialogs";

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-[#2a1145] text-white",
  ADMIN: "bg-[#eef2fb] text-eq",
  TRAINER: "bg-[#f3ecfb] text-mq",
  COMPANY_VIEWER: "bg-[#eafaf1] text-[#1a7a4a]",
  PARTICIPANT: "bg-page text-muted",
};

export default function UsersPage() {
  const principal = requireRole("ADMIN");
  const canSuper = principal.role === "SUPER_ADMIN";
  const { data: users } = useListUsers();
  const { data: companiesData } = useGetCompaniesData();
  const companies = (companiesData?.companies ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const rows = users ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] text-ink">Users</h2>
          <p className="text-[13px] text-muted-2">
            {rows.length} platform {rows.length === 1 ? "account" : "accounts"}{" "}
            — participants, trainers, viewers, and administrators.
          </p>
        </div>
        <AddUserDialog companies={companies} canSuper={canSuper} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1.1fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Company</span>
          <span className="text-right">Actions</span>
        </div>
        {rows.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1.1fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-ink">
                {u.name ?? "—"}
              </span>
              <span className="truncate text-[12px] text-muted-2">
                {u.email}
              </span>
            </span>
            <span>
              <Badge className={ROLE_STYLE[u.role] ?? "bg-page text-muted"}>
                {u.role}
              </Badge>
            </span>
            <span className="text-[12.5px]">
              {u.status === "active" ? (
                <span className="text-[#1a7a4a]">Active</span>
              ) : u.status === "invited" ? (
                <span className="text-[#b7791f]">Invited</span>
              ) : u.status === "disabled" ? (
                <span className="text-danger">Disabled</span>
              ) : (
                <span className="text-muted">{u.status}</span>
              )}
            </span>
            <span className="truncate text-[12.5px] text-muted">
              {u.companyName ?? "—"}
            </span>
            <span className="flex items-center justify-end gap-3">
              <ImpersonateUserButton user={u} />
              <EditUserDialog
                user={u}
                companies={companies}
                canSuper={canSuper}
              />
              <DeleteUserButton user={u} />
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-5 py-6 text-[13px] text-muted">No users yet.</div>
        )}
      </Card>
    </div>
  );
}
