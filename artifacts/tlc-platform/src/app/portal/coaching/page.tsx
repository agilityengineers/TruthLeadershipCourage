import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { requireRole } from "@/lib/session";
import {
  useBookCoachingSession,
  useGetCoachingSlots,
  useGetParticipantContext,
} from "@workspace/api-client-react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LabelCaps } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { RescheduleDialog } from "@/components/portal/reschedule-dialog";
import { CalendarPlus, Download } from "lucide-react";

const SESSION_TYPES = ["LESSON_SESSION", "PRACTICE_SESSION", "GRADUATION", "WEEKLY_SESSION", "KICKOFF"];

export default function CoachingPage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data: enr } = useGetParticipantContext();
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;

  const now = Date.now();
  const upcoming = enr.cohort.events
    .filter((e) => SESSION_TYPES.includes(e.type) && new Date(e.startAt).getTime() >= now)
    .slice(0, 6);
  const activeBookings = enr.bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[18px] text-ink">Your 1:1 coaching</h3>
            <span className="text-[12px] text-muted-3">2 private sessions included</span>
          </div>
          <div className="flex flex-col gap-3">
            {activeBookings.length === 0 && (
              <p className="text-[13px] text-muted">
                Your coaching happens in the Intersession — the eight weeks between Session 1 and
                Session 2 — with {enr.cohort.trainer?.name ?? "your trainer"}.
              </p>
            )}
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-[12px] border border-hair-2 p-4"
              >
                <div className="w-12 shrink-0 text-center">
                  <div className="text-[10px] font-semibold uppercase text-muted-3">
                    {formatDate(b.slot, { month: "short" })}
                  </div>
                  <div className="font-display text-[20px] text-mq">
                    {formatDate(b.slot, { day: "numeric" })}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-ink">
                    Coaching session {b.sequence} · {b.trainer?.name ?? "Trainer"}
                  </div>
                  <div className="text-[12.5px] text-muted-2">
                    {formatDate(b.slot, { weekday: "long", hour: "numeric", minute: "2-digit" })} ·{" "}
                    <span className="capitalize">{b.status.toLowerCase()}</span>
                  </div>
                </div>
                <RescheduleDialog bookingId={b.id} currentSlot={b.slot} />
              </div>
            ))}
          </div>
          <BookSlot />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[18px] text-ink">Upcoming sessions</h3>
            <a
              href={`/api/calendar/${enr.cohortId}.ics`}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-eq"
            >
              <Download className="h-3.5 w-3.5" /> Add all to calendar (.ics)
            </a>
          </div>
          <div className="flex flex-col gap-2.5">
            {upcoming.length === 0 && (
              <p className="text-[13px] text-muted">No group sessions on the calendar right now.</p>
            )}
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-[10px] border border-hair-2 px-4 py-2.5">
                <div className="w-11 shrink-0 text-center">
                  <div className="text-[10px] font-semibold text-muted-3">
                    {formatDate(e.startAt, { month: "short" }).toUpperCase()}
                  </div>
                  <div className="font-display text-[18px] text-indigo">
                    {formatDate(e.startAt, { day: "numeric" })}
                  </div>
                </div>
                <div className="flex-1 text-[13px] font-semibold text-ink">{e.title}</div>
                <span className="text-[11.5px] text-muted-2">
                  {formatDate(e.startAt, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <LabelCaps className="mb-3">Calendar sync</LabelCaps>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Keep every session and coaching slot on your calendar. Download the full schedule or add
          individual events.
        </p>
        <Button asChild variant="outline" className="w-full">
          <a href={`/api/calendar/${enr.cohortId}.ics`}>
            <CalendarPlus className="h-4 w-4" /> Download schedule
          </a>
        </Button>
      </Card>
    </div>
  );
}

/** Self-serve Intersession booking: pick a time, that's the whole flow. */
function BookSlot() {
  const { data: slotsData } = useGetCoachingSlots();
  const [selected, setSelected] = useState<string | null>(null);
  const qc = useQueryClient();
  const { mutate, isPending } = useBookCoachingSession();

  if (!slotsData) return null;
  const remaining = slotsData.includedSessions - slotsData.bookedCount;
  if (remaining <= 0 || slotsData.slots.length === 0) return null;

  function book() {
    if (!selected) return;
    mutate(
      { data: { slot: selected } },
      {
        onSuccess: () => {
          toast.success("Booked. It's on your schedule.");
          setSelected(null);
          qc.invalidateQueries();
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn't book that time — pick another."),
      },
    );
  }

  return (
    <div className="mt-5 border-t border-hair-2 pt-5">
      <LabelCaps className="mb-1.5">Book your coaching session</LabelCaps>
      <p className="text-[12.5px] text-muted-2">
        Times during your Intersession
        {slotsData.intersessionStart
          ? ` (${formatDate(slotsData.intersessionStart, { month: "short", day: "numeric" })} – ${
              slotsData.intersessionEnd
                ? formatDate(slotsData.intersessionEnd, { month: "short", day: "numeric" })
                : ""
            })`
          : ""}
        . {remaining} of {slotsData.includedSessions} included sessions left to book.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {slotsData.slots.slice(0, 9).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelected(s === selected ? null : s)}
            className={cn(
              "rounded-[9px] border px-3 py-2 text-[12.5px] font-medium transition-colors",
              selected === s
                ? "border-teal bg-teal text-white"
                : "border-hair-1 bg-white text-ink hover:border-teal",
            )}
          >
            {formatDate(s, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </button>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3 bg-teal hover:bg-teal-hover"
        onClick={book}
        disabled={!selected || isPending}
      >
        {isPending ? "Booking…" : "Book this time"}
      </Button>
    </div>
  );
}
