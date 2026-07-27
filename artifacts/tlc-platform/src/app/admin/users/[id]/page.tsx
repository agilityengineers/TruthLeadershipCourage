import { Link, useParams } from "wouter";
import { requireRole } from "@/lib/session";
import { useGetUser } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LabelCaps } from "@/components/brand/primitives";
import { initials, formatDate } from "@/lib/utils";

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-[#2a1145] text-white",
  ADMIN: "bg-[#eef2fb] text-eq",
  TRAINER: "bg-[#f3ecfb] text-mq",
  COMPANY_VIEWER: "bg-[#eafaf1] text-[#1a7a4a]",
  PARTICIPANT: "bg-page text-muted",
};

const ENROLL_STYLE: Record<string, string> = {
  ACTIVE: "text-[#1a7a4a]",
  COMPLETED: "text-eq",
  PENDING: "text-[#b7791f]",
  WAITLISTED: "text-[#b7791f]",
};

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-muted-3">{label}</span>
      <span className="text-[13.5px] text-ink">{value || <span className="text-muted-3">—</span>}</span>
    </div>
  );
}

export default function UserDetailPage() {
  requireRole("ADMIN");
  const { id } = useParams();
  const { data: user, isLoading } = useGetUser(id ?? "");

  if (isLoading) return <></>;
  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted">User not found.</p>
        <Link href="/admin/users" className="mt-3 inline-block text-[12px] font-semibold text-eq">
          ← All users
        </Link>
      </Card>
    );
  }

  const name = user.name ?? user.email;
  const phoneHref = user.phone ? `tel:${user.phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/users" className="text-[12px] font-semibold text-eq hover:underline">
        ← All users
      </Link>

      {/* Profile / contact — the CRM header */}
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar label={initials(name)} size={52} style={{ background: "#b8d8e6", color: "#262161" }} />
          <div className="min-w-0">
            <h2 className="font-display text-[22px] text-ink">{name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={ROLE_STYLE[user.role] ?? "bg-page text-muted"}>{user.role}</Badge>
              <span className="text-[12.5px] capitalize text-muted-2">{user.status}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail
            label="Email"
            value={
              <a href={`mailto:${user.email}`} className="text-eq hover:underline">
                {user.email}
              </a>
            }
          />
          <Detail
            label="Phone"
            value={
              phoneHref ? (
                <a href={phoneHref} className="text-eq hover:underline">
                  {user.phone}
                </a>
              ) : null
            }
          />
          <Detail label="Company" value={user.companyName} />
          <Detail label="Title" value={user.title} />
          <Detail label="Joined" value={user.createdAt ? formatDate(user.createdAt) : null} />
          <Detail label="Account" value={user.hasPassword ? "Password set" : "Invite pending"} />
        </div>
      </Card>

      {/* Cohort enrollments — the relationship history */}
      <Card className="p-6">
        <LabelCaps className="mb-4">Cohorts &amp; enrollments</LabelCaps>
        {user.enrollments.length === 0 ? (
          <p className="text-[13px] text-muted">No cohort enrollments yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[#f1f3f8]">
            {user.enrollments.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{e.cohortName}</div>
                  {e.enrolledAt && (
                    <div className="text-[12px] text-muted-2">Enrolled {formatDate(e.enrolledAt)}</div>
                  )}
                </div>
                <span className={`text-[12.5px] font-semibold ${ENROLL_STYLE[e.status] ?? "text-muted"}`}>
                  {e.status}
                </span>
                {e.paymentStatus && (
                  <Badge className="bg-page text-muted">Payment: {e.paymentStatus}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
