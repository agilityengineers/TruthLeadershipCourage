import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { cohortScope } from "@/lib/scope";
import { EventManager } from "@/components/trainer/event-manager";

export const dynamic = "force-dynamic";

export default async function TrainerEventsPage() {
  const principal = await requireRole("TRAINER", "ADMIN");

  const cohorts = await db.cohort.findMany({
    where: cohortScope(principal),
    orderBy: { startDate: "asc" },
    select: { id: true, name: true },
  });
  const cohortIds = cohorts.map((c) => c.id);

  const events = await db.event.findMany({
    where: { cohortId: { in: cohortIds } },
    orderBy: { startAt: "asc" },
    include: { cohort: { select: { name: true } } },
  });

  const data = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    joinUrl: e.joinUrl,
    cohortName: e.cohort.name,
    weekNo: e.weekNo,
  }));

  const modules = await db.module.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, weekNo: true },
  });

  return <EventManager events={data} cohorts={cohorts} modules={modules} />;
}
