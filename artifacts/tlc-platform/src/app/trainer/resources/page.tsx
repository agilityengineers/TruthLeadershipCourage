import { requireRole } from "@/lib/session";
import { useGetTrainerResourcesData } from "@workspace/api-client-react";
import { ResourceManager } from "@/components/trainer/resource-manager";

export default function TrainerResourcesPage() {
  requireRole("TRAINER", "ADMIN");

  const { data } = useGetTrainerResourcesData();
  const cohorts = data?.cohorts ?? [];
  const resources = data?.resources ?? [];
  const modules = data?.modules ?? [];

  const rows = resources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status,
    moduleTitle: r.module?.title ?? null,
    cohortName: r.cohortName ?? "—",
    printReady: r.printReady,
  }));

  return (
    <ResourceManager
      resources={rows}
      cohorts={cohorts}
      modules={modules}
    />
  );
}
