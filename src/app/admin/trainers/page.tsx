import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  await requireRole("ADMIN");
  const trainers = await db.user.findMany({
    where: { role: "TRAINER" },
    orderBy: { name: "asc" },
    include: {
      trainerCohorts: { include: { _count: { select: { enrollments: true } } } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Trainers</h2>
        <p className="text-[13px] text-muted-2">{trainers.length} operational trainers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trainers.map((t) => {
          const participants = t.trainerCohorts.reduce((a, c) => a + c._count.enrollments, 0);
          return (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar label={initials(t.name)} size={42} style={{ background: "#662d91", color: "#fff" }} />
                <div>
                  <div className="text-[15px] font-semibold text-ink">{t.name}</div>
                  <div className="text-[12px] text-muted-2">{t.title ?? "Trainer"}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-6">
                <div>
                  <div className="font-display text-[22px] text-eq">{t.trainerCohorts.length}</div>
                  <div className="text-[11px] text-muted-2">cohorts</div>
                </div>
                <div>
                  <div className="font-display text-[22px] text-mq">{participants}</div>
                  <div className="text-[11px] text-muted-2">participants</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.trainerCohorts.map((c) => (
                  <span key={c.id} className="rounded-pill bg-page px-2.5 py-1 text-[11px] text-muted">
                    {c.name}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
