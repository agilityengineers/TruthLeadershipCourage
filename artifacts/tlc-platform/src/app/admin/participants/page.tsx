import { requireRole } from "@/lib/session";
import { useListParticipants } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export default function AdminParticipantsPage() {
  requireRole("ADMIN");
  const { data } = useListParticipants();
  const enrollments = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] text-ink">Participants</h2>
        <p className="text-[13px] text-muted-2">{enrollments.length} enrollments across all cohorts.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr_0.8fr] border-b border-hair-3 bg-soft-2 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[.07em] text-muted-3">
          <span>Participant</span>
          <span>Company</span>
          <span>Cohort</span>
          <span>Progress</span>
          <span>Status</span>
        </div>
        {enrollments.map((e) => {
          const done = e.completedCount;
          const pct = Math.round((done / 24) * 100);
          return (
            <div
              key={e.id}
              className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr_0.8fr] items-center border-b border-[#f1f3f8] px-5 py-3 last:border-0"
            >
              <span className="flex items-center gap-2.5">
                <Avatar label={initials(e.userName)} size={30} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{e.userName}</span>
                  <span className="block truncate text-[11.5px] text-muted-2">{e.userEmail}</span>
                </span>
              </span>
              <span className="text-[12.5px] text-muted">{e.companyName ?? "Independent"}</span>
              <span className="text-[12.5px] text-muted">{e.cohortName}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-[110px] overflow-hidden rounded-pill bg-[#e3e7f1]">
                  <span
                    className="block h-full rounded-pill"
                    style={{ width: `${pct}%`, background: pct < 50 ? "#e0a32e" : "#024794" }}
                  />
                </span>
                <span className="text-[11.5px] text-muted-2">{pct}%</span>
              </span>
              <span>
                <Badge variant={e.status === "COMPLETED" ? "neutral" : e.status === "ACTIVE" ? "success" : "warning"} size="sm">
                  {e.status}
                </Badge>
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
