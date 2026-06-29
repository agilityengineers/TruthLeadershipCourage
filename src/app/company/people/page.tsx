import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { userScope } from "@/lib/scope";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyPeoplePage() {
  const principal = await requireRole("COMPANY_VIEWER", "ADMIN");
  const people = await db.user.findMany({
    where: { ...userScope(principal), role: "PARTICIPANT" },
    include: {
      enrollments: { include: { cohort: true, moduleProgress: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">People</h2>
        <p className="text-[13px] text-muted-2">{people.length} participants from your company.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => {
          const enr = p.enrollments[0];
          const pct = enr
            ? Math.round((enr.moduleProgress.filter((m) => m.status === "COMPLETED").length / 24) * 100)
            : 0;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar label={initials(p.name)} size={42} />
                <div>
                  <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                  <div className="text-[12px] text-muted-2">{p.title ?? "Participant"}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[12px] text-muted-2">
                  <span>{enr?.cohort.name ?? "Not enrolled"}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-[#e3e7f1]">
                  <div className="h-full rounded-pill bg-gradient-to-r from-eq to-mq" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
        {people.length === 0 && <p className="text-[13px] text-muted">No participants yet.</p>}
      </div>
    </div>
  );
}
