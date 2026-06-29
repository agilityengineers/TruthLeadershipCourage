import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { AddCompanyDialog, PurchaseSeatsDialog } from "@/components/admin/admin-dialogs";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  await requireRole("ADMIN");
  const [companies, cohorts] = await Promise.all([
    db.company.findMany({
      orderBy: { name: "asc" },
      include: {
        seats: true,
        enrollments: { include: { cohort: true } },
        users: true,
      },
    }),
    db.cohort.findMany({ where: { status: { in: ["ENROLLING", "RUNNING"] } }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] text-ink">Companies</h2>
          <p className="text-[13px] text-muted-2">{companies.length} corporate clients (tenants).</p>
        </div>
        <AddCompanyDialog />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.8fr_1fr_1fr_0.8fr_0.9fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>Company</span>
          <span>Cohort</span>
          <span>Seats</span>
          <span>Viewers</span>
          <span>Actions</span>
        </div>
        {companies.map((c) => {
          const assigned = c.seats.filter((s) => s.status !== "AVAILABLE").length;
          const viewers = c.users.filter((u) => u.role === "COMPANY_VIEWER").length;
          const cohortName = c.enrollments[0]?.cohort.name ?? "—";
          return (
            <div
              key={c.id}
              className="grid grid-cols-[1.8fr_1fr_1fr_0.8fr_0.9fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#eef2fb] text-[12px] font-bold text-eq">
                  {c.name[0]}
                </span>
                <span className="text-[13px] font-semibold text-ink">{c.name}</span>
              </span>
              <span className="text-[12.5px] text-muted">{cohortName}</span>
              <span className="text-[12.5px] font-semibold text-ink">
                {assigned} / {c.seats.length || c.enrollments.length}
              </span>
              <span className="text-[12.5px] text-muted">{viewers}</span>
              <PurchaseSeatsDialog companyId={c.id} cohorts={cohorts} />
            </div>
          );
        })}
        {companies.length === 0 && <div className="px-5 py-6 text-[13px] text-muted">No companies yet.</div>}
      </Card>
    </div>
  );
}
