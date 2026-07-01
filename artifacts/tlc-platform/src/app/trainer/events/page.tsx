import { requireRole } from "@/lib/session";
import { useGetTrainerEventsData } from "@workspace/api-client-react";
import { EventManager } from "@/components/trainer/event-manager";

export default function TrainerEventsPage() {
  requireRole("TRAINER", "ADMIN");

  const { data } = useGetTrainerEventsData();
  const cohorts = data?.cohorts ?? [];
  const events = data?.events ?? [];
  const modules = data?.modules ?? [];

  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt,
    joinUrl: e.joinUrl ?? null,
    cohortName: e.cohortName ?? "—",
    weekNo: e.weekNo ?? null,
  }));

  return <EventManager events={rows} cohorts={cohorts} modules={modules} />;
}
