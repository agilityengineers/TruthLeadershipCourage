import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabelCaps } from "@/components/brand/primitives";
import { formatDate } from "@/lib/utils";

export default function AdminResourcesPage() {
  requireRole("ADMIN");
  const resources = db.resource.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { cohort: true, module: true },
  });
  const events = db.event.findMany({
    where: { startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 12,
    include: { cohort: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Resources &amp; Events</h2>
        <p className="text-[13px] text-muted-2">System-wide content and scheduling across all cohorts.</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <LabelCaps className="mb-4">Resources</LabelCaps>
          <div className="flex flex-col gap-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-[10px] border border-hair-2 px-4 py-2.5">
                <span className="flex h-7 w-9 items-center justify-center rounded-md bg-[#eef2fb] text-[10px] font-bold text-eq">
                  {r.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{r.title}</span>
                <span className="text-[11.5px] text-muted-3">{r.cohort?.name ?? "Program"}</span>
                <Badge variant={r.status === "PUBLISHED" ? "success" : "warning"} size="sm">
                  {r.status}
                </Badge>
              </div>
            ))}
            {resources.length === 0 && <p className="text-[13px] text-muted">No resources yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <LabelCaps className="mb-4">Upcoming events</LabelCaps>
          <div className="flex flex-col gap-3">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="w-11 shrink-0 text-center">
                  <div className="text-[10px] font-semibold text-muted-3">
                    {formatDate(e.startAt, { month: "short" }).toUpperCase()}
                  </div>
                  <div className="font-display text-[18px] text-indigo">
                    {formatDate(e.startAt, { day: "numeric" })}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-ink">{e.title}</div>
                  <div className="text-[11.5px] text-muted-2">{e.cohort.name}</div>
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-[13px] text-muted">No upcoming events.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
