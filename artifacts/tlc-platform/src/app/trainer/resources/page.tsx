import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { cohortScope } from "@/lib/scope";
import { ResourceManager } from "@/components/trainer/resource-manager";

export default function TrainerResourcesPage() {
  const principal = requireRole("TRAINER", "ADMIN");

  const cohorts = db.cohort.findMany({
    where: cohortScope(principal),
    orderBy: { startDate: "asc" },
    select: { id: true, name: true },
  });
  const cohortIds = cohorts.map((c) => c.id);

  const resources = db.resource.findMany({
    where: { cohortId: { in: cohortIds } },
    orderBy: { createdAt: "desc" },
    include: { module: true, cohort: { select: { name: true } } },
  });

  // Modules available for tagging (program-level; shared across cohorts).
  const modules = db.module.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, pillar: true, weekNo: true },
  });

  const data = resources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status,
    moduleTitle: r.module?.title ?? null,
    cohortName: r.cohort?.name ?? "—",
    printReady: r.printReady,
  }));

  return (
    <ResourceManager
      resources={data}
      cohorts={cohorts}
      modules={modules}
    />
  );
}
