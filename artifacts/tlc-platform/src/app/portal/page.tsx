import { useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import { requireRole } from "@/lib/session";
import { getParticipantContext, deriveJourney } from "@/server/portal-data";
import { markWeekCompleteAction } from "@/server/progress-actions";
import { derivePhase, type Phase } from "@/lib/cohort";
import { daysUntil, formatDate, PILLAR_LABEL } from "@/lib/utils";
import { PhaseToggle } from "@/components/portal/phase-toggle";
import { Stepper, type Step } from "@/components/brand/stepper";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { LabelCaps, StatBlock } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function PortalHome() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const enr = getParticipantContext(principal.id);

  if (!enr) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted">You don't have an active enrollment yet.</p>
        <Button asChild className="mt-4">
          <Link href="/assessment">Start the assessment</Link>
        </Button>
      </Card>
    );
  }

  const sp = new URLSearchParams(useSearch()).get("phase") ?? undefined;
  const override = (["before", "during", "after"].includes(sp ?? "") ? sp : undefined) as
    | Phase
    | undefined;
  const journey = deriveJourney(enr, override);
  const derived = derivePhase(enr.cohort.startDate, enr.cohort.endDate);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-[20px] text-ink">
            {journey.phase === "before"
              ? "Before your cohort begins"
              : journey.phase === "during"
                ? `Welcome back, ${enr.user.name?.split(" ")[0] ?? ""}.`
                : "Program complete"}
          </h2>
          {override && override !== derived && (
            <p className="text-[11.5px] text-muted-3">
              Previewing “{override}” · live phase is “{derived}”
            </p>
          )}
        </div>
        <PhaseToggle active={journey.phase} />
      </div>

      {journey.phase === "before" && <BeforePhase enr={enr} />}
      {journey.phase === "during" && <DuringPhase enr={enr} journey={journey} />}
      {journey.phase === "after" && <AfterPhase enr={enr} />}
    </div>
  );
}

/* ───────────────────────── BEFORE ───────────────────────── */

function BeforePhase({ enr }: { enr: NonNullable<Awaited<ReturnType<typeof getParticipantContext>>> }) {
  const days = daysUntil(enr.cohort.startDate);
  const shipStatus = enr.shipment?.status ?? "PENDING";
  const steps: Step[] = [
    { label: "Ordered", state: "done" },
    {
      label: "Printing",
      state: shipStatus === "PRINTING" ? "current" : shipStatus === "PENDING" ? "todo" : "done",
    },
    {
      label: "Shipped",
      state: shipStatus === "SHIPPED" || shipStatus === "DELIVERED" ? "done" : "todo",
    },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-[18px]">
        <div className="rounded-[16px] bg-[linear-gradient(150deg,#262161,#024794)] p-[30px] text-white">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-sky">
            You're enrolled · {enr.cohort.name}
          </div>
          <h3 className="mb-2 font-display text-[27px] text-white">
            Your cohort begins in <em className="italic text-sky">{days} days.</em>
          </h3>
          <p className="mb-5 text-[14.5px] leading-relaxed text-[#cdd6ee]">
            First live session: {formatDate(enr.cohort.startDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {enr.cohort.sessionTime} {enr.cohort.timezone.includes("Los") ? "PST" : ""}. We'll send your join link and reminders as it gets closer.
          </p>
          <div className="flex gap-7">
            <StatBlock value={formatDate(enr.cohort.startDate, { month: "short", day: "numeric" })} label="KICKOFF" />
            <StatBlock value="24" label="WEEKLY SESSIONS" />
            <StatBlock value="2" label="1:1 COACHING" />
          </div>
        </div>

        <Card className="p-[22px]">
          <h4 className="mb-1 text-[18px] text-ink">While you wait</h4>
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted-2">A few small steps to arrive ready.</p>
          <div className="flex flex-col gap-2.5">
            <ChecklistRow done label="Complete your profile & goals" action="Done" />
            <ChecklistRow label="Read the welcome letter from Tri" action="Open" href="/portal/messages" />
            <ChecklistRow label="Add the session schedule to your calendar" action="View" href="/portal/coaching" />
            <ChecklistRow label="Preview the digital workbook" action="Preview" href="/portal/workbook" />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-[18px]">
        <Card className="p-5">
          <LabelCaps className="mb-3.5">Workbook shipment</LabelCaps>
          <div className="mb-3">
            <Stepper steps={steps} />
          </div>
          <p className="text-[12.5px] leading-relaxed text-muted-2">
            Your physical workbook &amp; materials ship the week before kickoff. We'll email tracking.
          </p>
        </Card>
        <div className="rounded-card border border-[#e6dff3] bg-[#f6f4fb] p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <img src="/brand/wisdomtri-logo.jpg" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
            </span>
            <div>
              <div className="text-[13px] font-semibold text-indigo">A note from Tri</div>
              <div className="text-[11px] font-medium text-[#9a7bb0]">Founder</div>
            </div>
          </div>
          <p className="font-display text-[14px] italic leading-relaxed text-[#3a2e4d]">
            “Welcome — and thank you for answering the call. Come as you are; we'll build the rest together.”
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── DURING ───────────────────────── */

function DuringPhase({
  enr,
  journey,
}: {
  enr: NonNullable<Awaited<ReturnType<typeof getParticipantContext>>>;
  journey: ReturnType<typeof deriveJourney>;
}) {
  const week = journey.week;
  const thisWeek = enr.moduleProgress.find((m) => m.weekNo === week) ?? enr.moduleProgress[0];
  const upNext = enr.moduleProgress.find((m) => m.weekNo === week + 1);
  const recent = enr.moduleProgress.find((m) => m.weekNo === week - 1);
  const mod = thisWeek?.module;
  const nextCoaching = enr.bookings.find((b) => b.status !== "COMPLETED");
  const liveEvent = enr.cohort.events.find((e) => e.weekNo === week && e.type === "WEEKLY_SESSION");

  const [, force] = useState(0);
  const bump = () => force((n) => n + 1);
  const markWeekComplete = async () => {
    await markWeekCompleteAction(enr.id, week);
    toast.success("Week marked complete");
    bump();
  };

  return (
    <>
      <div className="mb-2">
        <p className="text-[13.5px] font-medium text-muted-2">
          {enr.cohort.name} · Week {week} of {journey.totalWeeks}
        </p>
        <div className="mt-3 max-w-[520px]">
          <Progress value={journey.pct} height={9} />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card className="p-6">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span
                className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.06em] text-white"
                style={{ background: mod?.pillar === "EQ" ? "#024794" : mod?.pillar === "MQ" ? "#662d91" : "#262161" }}
              >
                {PILLAR_LABEL[mod?.pillar ?? "IQ"]} · {mod?.pillar === "EQ" ? "Build the Leader" : mod?.pillar === "MQ" ? "Future Leaders" : "Build the Team"}
              </span>
              <span className="text-[12px] font-medium text-muted-3">Week {week}</span>
            </div>
            <h3 className="mb-1.5 font-display text-[25px] text-ink">{mod?.title ?? "This week"}</h3>
            <p className="mb-5 max-w-[42em] text-[14.5px] leading-relaxed text-muted">
              {mod?.summary ?? "Your focus for the week."}
            </p>
            <div className="mb-5 flex flex-col gap-2.5">
              <ChecklistRow done label="Pre-work: read & reflect" />
              <ChecklistRow
                label={`Worksheet ${week} — ${mod?.title ?? "this week"}`}
                action="Download PDF"
                href="/portal/materials"
                secondaryAction="Print"
              />
              <ChecklistRow label={`Live session — ${enr.cohort.sessionDay}, ${enr.cohort.sessionTime}`} />
            </div>
            <Button type="submit" onClick={markWeekComplete}>Mark week complete</Button>
          </Card>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Card className="p-[18px]">
              <LabelCaps className="mb-2.5">Up next</LabelCaps>
              <div className="font-display text-[16px] text-ink">
                Week {week + 1} · {upNext?.module?.title ?? "Coming up"}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted-2">
                Unlocks next {enr.cohort.sessionDay}.
              </p>
            </Card>
            <Card className="p-[18px]">
              <LabelCaps className="mb-2.5">Recently completed</LabelCaps>
              <div className="font-display text-[16px] text-ink">
                Week {Math.max(1, week - 1)} · {recent?.module?.title ?? "Last week"}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted-2">
                Session notes &amp; recording available.
              </p>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <div className="rounded-card bg-indigo p-5 text-white">
            <LabelCaps className="mb-3 text-sky">This week's live session</LabelCaps>
            <div className="mb-1 font-display text-[19px]">
              {enr.cohort.sessionDay} · {enr.cohort.sessionTime}
            </div>
            <div className="mb-4 text-[12.5px] text-[#bcc6e6]">{mod?.title ?? "Session"} · with {enr.cohort.trainer?.name ?? "Tri"}</div>
            {liveEvent?.joinUrl ? (
              <Button asChild variant="light" className="w-full font-bold">
                <a href={liveEvent.joinUrl} target="_blank" rel="noreferrer">Join session</a>
              </Button>
            ) : (
              <Button variant="light" className="w-full font-bold" disabled>
                Join link coming soon
              </Button>
            )}
          </div>
          <Card className="p-[18px]">
            <LabelCaps className="mb-3">Workbook</LabelCaps>
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#d6ecdf] bg-[#f5fbf7] text-success">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-ink">
                  {enr.shipment?.status === "DELIVERED" ? "Delivered" : "On its way"}
                </div>
                <div className="text-[11.5px] text-muted-2">Digital version always available</div>
              </div>
            </div>
          </Card>
          {nextCoaching && (
            <div className="rounded-card border border-[#e6dff3] bg-[#f6f4fb] p-[18px]">
              <LabelCaps className="mb-2 text-[#8a5fb0]">Next coaching 1:1</LabelCaps>
              <div className="font-display text-[17px] text-[#3a2e4d]">
                {formatDate(nextCoaching.slot, { month: "short", day: "numeric" })} ·{" "}
                {formatDate(nextCoaching.slot, { hour: "numeric", minute: "2-digit" })}
              </div>
              <Link href="/portal/coaching" className="mt-2 inline-block text-[12px] font-semibold text-mq">
                Reschedule
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── AFTER ───────────────────────── */

function AfterPhase({ enr }: { enr: NonNullable<Awaited<ReturnType<typeof getParticipantContext>>> }) {
  const libraryTiles = [
    { icon: "selfdiscovery.png", title: "EQ · Build the Leader", sub: "8 modules · workbook · recordings" },
    { icon: "trust.png", title: "IQ · Build the Team", sub: "10 modules · workbook · recordings" },
    { icon: "grit.png", title: "MQ™ · Future Leaders", sub: "6 modules · workbook · recordings" },
    { icon: "inspire.png", title: "Coaching notes", sub: "Your 1:1 summaries & actions" },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-[18px]">
        <div className="rounded-[16px] bg-[linear-gradient(150deg,#662d91,#262161)] p-[30px] text-white">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[#e2cdf0]">
            Program complete · {formatDate(enr.cohort.endDate, { month: "short", year: "numeric" })}
          </div>
          <h3 className="mb-2 font-display text-[27px] text-white">
            You answered the call, <em className="italic text-[#e2cdf0]">{enr.user.name?.split(" ")[0]}.</em>
          </h3>
          <p className="max-w-[40em] text-[14.5px] leading-relaxed text-[#e6ddf2]">
            You completed all 24 weeks of TLC. Your materials, recordings, and the full resource
            library stay open to you — for whenever you need them.
          </p>
        </div>
        <Card className="p-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-[18px] text-ink">Resource library</h4>
            <span className="text-[12px] font-medium text-muted-3">Always accessible · 24 modules</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {libraryTiles.map((t) => (
              <Link
                key={t.title}
                href="/portal/library"
                className="flex gap-3 rounded-[11px] border border-hair-2 p-3.5 transition-colors hover:bg-soft-1"
              >
                <img src={`/brand/${t.icon}`} alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0" />
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{t.title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-muted-2">{t.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-[18px]">
        <Card className="p-5">
          <LabelCaps className="mb-3">Your journey</LabelCaps>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[34px] leading-none text-eq">100%</span>
            <span className="text-[13px] text-muted-2">complete</span>
          </div>
          <div className="mt-2.5">
            <Progress value={100} />
          </div>
          <div className="mt-2.5 text-[12px] leading-snug text-muted-2">
            24 of 24 weeks · 2 coaching sessions · {formatDate(enr.cohort.startDate, { month: "short", year: "numeric" })}–{formatDate(enr.cohort.endDate, { month: "short", year: "numeric" })}
          </div>
          {enr.certificate && (
            <Link href="/portal/progress" className="mt-3 inline-block text-[12.5px] font-semibold text-eq">
              View completion certificate →
            </Link>
          )}
        </Card>
        <Card className="p-5">
          <LabelCaps className="mb-2.5">Stay connected</LabelCaps>
          <p className="mb-3 text-[13px] leading-relaxed text-muted">
            The portal remains your home base — messages and the library stay open after completion.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/portal/messages">Message Tri</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function ChecklistRow({
  label,
  done,
  action,
  href,
  secondaryAction,
}: {
  label: string;
  done?: boolean;
  action?: string;
  href?: string;
  secondaryAction?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-[10px] border px-3.5 py-3 ${
        done ? "border-[#d6ecdf] bg-[#f5fbf7]" : "border-hair-1 bg-[#fafbfd]"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-success text-white" : "border-2 border-[#c3c6d4]"
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <span className="flex-1 text-[14px] font-medium text-[#2b2747]">{label}</span>
      {done ? (
        <span className="text-[12px] font-medium text-success">{action ?? "Done"}</span>
      ) : (
        <span className="flex gap-2.5">
          {action &&
            (href ? (
              <Link href={href} className="text-[12px] font-semibold text-eq">
                {action}
              </Link>
            ) : (
              <span className="text-[12px] font-semibold text-eq">{action}</span>
            ))}
          {secondaryAction && <span className="text-[12px] font-semibold text-muted-3">{secondaryAction}</span>}
        </span>
      )}
    </div>
  );
}
