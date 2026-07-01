import * as React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateEvent } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { LabelCaps } from "@/components/brand/primitives";

type EventRow = {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  joinUrl: string | null;
  cohortName: string;
  weekNo: number | null;
};

type CohortOpt = { id: string; name: string };
type ModuleOpt = { id: string; title: string; weekNo?: number | null };

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "WEEKLY_SESSION", label: "Weekly session" },
  { value: "COACHING_1ON1", label: "1:1 coaching" },
  { value: "KICKOFF", label: "Kickoff" },
];

const TYPE_LABEL: Record<string, string> = {
  WEEKLY_SESSION: "Weekly session",
  COACHING_1ON1: "1:1 coaching",
  KICKOFF: "Kickoff",
};

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", opts).format(new Date(iso));
}

export function EventManager({
  events,
  cohorts,
  modules,
}: {
  events: EventRow[];
  cohorts: CohortOpt[];
  modules: ModuleOpt[];
}) {
  const qc = useQueryClient();
  const createEvent = useCreateEvent();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const weekRaw = String(form.get("weekNo") ?? "").trim();
    setPending(true);
    try {
      await createEvent.mutateAsync({
        data: {
          cohortId: String(form.get("cohortId")),
          type: String(form.get("type")),
          title: String(form.get("title")),
          startAt: String(form.get("startAt")),
          endAt: String(form.get("endAt")),
          joinUrl: (form.get("joinUrl") as string) || undefined,
          weekNo: weekRaw ? Number(weekRaw) : null,
          moduleId: (form.get("moduleId") as string) || undefined,
        },
      });
      setOpen(false);
      toast.success("Event created");
      qc.invalidateQueries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startAt).getTime() >= now);
  const past = events.filter((e) => new Date(e.startAt).getTime() < now).reverse();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-caps">Events &amp; Sessions</div>
          <h2 className="mt-1 font-display text-[24px] text-ink">Schedule</h2>
          <p className="mt-1 text-[13px] text-muted-2">
            Weekly sessions and 1:1 coaching across your cohorts.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              + New event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New event</DialogTitle>
              <DialogDescription>Add a session or coaching call to a cohort.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Wk 7 · Hard Conversations" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cohortId">Cohort</Label>
                  <select
                    id="cohortId"
                    name="cohortId"
                    required
                    className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue="WEEKLY_SESSION"
                    className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startAt">Starts</Label>
                  <Input id="startAt" name="startAt" type="datetime-local" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endAt">Ends</Label>
                  <Input id="endAt" name="endAt" type="datetime-local" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="weekNo">Week # (optional)</Label>
                  <Input id="weekNo" name="weekNo" type="number" min={1} max={24} placeholder="7" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="moduleId">Module (optional)</Label>
                  <select
                    id="moduleId"
                    name="moduleId"
                    defaultValue=""
                    className="h-11 rounded-[9px] border border-[#e0e4ee] bg-white px-3 text-sm text-ink focus:border-eq focus:outline-none focus:ring-2 focus:ring-eq/20"
                  >
                    <option value="">— None —</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.weekNo ? `W${m.weekNo} · ` : ""}
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="joinUrl">Join URL (optional)</Label>
                <Input id="joinUrl" name="joinUrl" placeholder="https://zoom.us/j/…" />
              </div>

              {error && <p className="text-[12.5px] font-medium text-danger">{error}</p>}

              <div className="flex justify-end gap-2.5">
                <DialogClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" variant="primary" size="sm" disabled={pending}>
                  {pending ? "Saving…" : "Create event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <EventList title="Upcoming" events={upcoming} typeLabel={TYPE_LABEL} fmt={fmt} emptyText="No upcoming events." />
      {past.length > 0 && (
        <EventList title="Past" events={past} typeLabel={TYPE_LABEL} fmt={fmt} emptyText="" muted />
      )}
    </div>
  );
}

function EventList({
  title,
  events,
  typeLabel,
  fmt,
  emptyText,
  muted = false,
}: {
  title: string;
  events: EventRow[];
  typeLabel: Record<string, string>;
  fmt: (iso: string, opts: Intl.DateTimeFormatOptions) => string;
  emptyText: string;
  muted?: boolean;
}) {
  return (
    <Card className="p-5">
      <LabelCaps className="mb-3.5">{title}</LabelCaps>
      <div className="flex flex-col gap-2.5">
        {events.map((ev) => {
          const isCoaching = ev.type === "COACHING_1ON1";
          return (
            <div
              key={ev.id}
              className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-hair-2 px-3.5 py-3"
              style={muted ? { opacity: 0.7 } : undefined}
            >
              <div className="w-[42px] flex-none text-center">
                <div className="text-[10px] font-semibold uppercase text-muted-3">
                  {fmt(ev.startAt, { month: "short" })}
                </div>
                <div
                  className="font-display text-[19px] leading-none"
                  style={{ color: isCoaching ? "#662d91" : "#262161" }}
                >
                  {fmt(ev.startAt, { day: "numeric" })}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink">{ev.title}</div>
                <div className="text-[11.5px] text-muted-2">
                  {ev.cohortName} · {typeLabel[ev.type]} ·{" "}
                  {fmt(ev.startAt, { weekday: "short", hour: "numeric", minute: "2-digit" })}–
                  {fmt(ev.endAt, { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              {ev.joinUrl && (
                <a
                  href={ev.joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-semibold text-eq hover:underline"
                >
                  Join link
                </a>
              )}
            </div>
          );
        })}
        {events.length === 0 && emptyText && (
          <div className="py-6 text-center text-[13px] text-muted">{emptyText}</div>
        )}
      </div>
    </Card>
  );
}
