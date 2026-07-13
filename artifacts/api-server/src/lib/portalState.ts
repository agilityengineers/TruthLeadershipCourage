import { db, schema, eq, and, or, inArray, asc, sql } from "./db";
import type { loadParticipantContext } from "../routes/portal";

/**
 * The participant home screen state machine — the "cadence contract".
 *
 * The portal moves in lockstep with the program schedule, never on its own
 * logic: Session 1 (Modules 1–6, two-week heartbeat), the 8-week Intersession,
 * Session 2 (Modules 7–8), graduation, and the 30-day close. Within a module
 * the screen cycles through exactly four states — BEFORE_LESSON → LIVE_IT →
 * BEFORE_PRACTICE → AFTER_PRACTICE — derived from the cohort's lesson and
 * practice session events. Nothing accumulates and nothing is stored per
 * state; everything here is a pure function of the schedule, the clock, and
 * what the participant has written.
 */

type EnrollmentTree = NonNullable<Awaited<ReturnType<typeof loadParticipantContext>>>;
type ModuleRow = EnrollmentTree["cohort"]["program"]["modules"][number];
type EventRow = EnrollmentTree["cohort"]["events"][number];

export type Segment = "PRE_START" | "SESSION_1" | "INTERSESSION" | "SESSION_2" | "GRADUATED" | "CLOSED";
export type CyclePhase = "BEFORE_LESSON" | "LIVE_IT" | "BEFORE_PRACTICE" | "AFTER_PRACTICE";

export type PreviewKey =
  | "pre_start"
  | "session_day"
  | "live_it"
  | "before_practice"
  | "intersession"
  | "graduated"
  | "closed";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** How close to the practice session the Join card returns (design: "as the Practice Session approaches"). */
const PRACTICE_APPROACH_MS = 36 * 60 * 60 * 1000;
/** Included 1:1 coaching sessions per enrollment. */
export const INCLUDED_COACHING_SESSIONS = 2;

export function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * DAY_MS);
}

export function weekOf(startDate: Date, now: Date): number {
  return Math.floor((now.getTime() - startDate.getTime()) / WEEK_MS) + 1;
}

/** A module's lesson/practice moments — real events when present, else synthesized from the cohort schedule. */
export type ModuleWindow = {
  module: ModuleRow;
  lessonStart: Date;
  lessonEnd: Date;
  practiceStart: Date;
  practiceEnd: Date;
  lessonJoinUrl: string | null;
  practiceJoinUrl: string | null;
};

function synthSession(cohortStart: Date, weekNo: number): { start: Date; end: Date } {
  const start = new Date(cohortStart.getTime() + (weekNo - 1) * WEEK_MS);
  return { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) };
}

/**
 * Build each module's two-session window. Cohorts with seeded/authored events
 * use their real timestamps and join links; cohorts without events fall back
 * to the schedule implied by startDate + the module's week numbers (the same
 * rule the seed uses, so both paths agree).
 */
export function moduleWindows(cohort: EnrollmentTree["cohort"]): ModuleWindow[] {
  const modules = [...cohort.program.modules].sort((a, b) => a.order - b.order);
  const events = cohort.events ?? [];
  return modules.map((m) => {
    const lessonEv = events.find((e) => e.moduleId === m.id && e.type === "LESSON_SESSION");
    const practiceEv = events.find((e) => e.moduleId === m.id && e.type === "PRACTICE_SESSION");
    const lessonWeek = m.lessonWeekNo ?? (m.order <= 6 ? m.order * 2 - 1 : 21 + (m.order - 7) * 2);
    const practiceWeek = m.practiceWeekNo ?? lessonWeek + 1;
    const lesson = lessonEv
      ? { start: new Date(lessonEv.startAt), end: new Date(lessonEv.endAt) }
      : synthSession(new Date(cohort.startDate), lessonWeek);
    const practice = practiceEv
      ? { start: new Date(practiceEv.startAt), end: new Date(practiceEv.endAt) }
      : synthSession(new Date(cohort.startDate), practiceWeek);
    return {
      module: m,
      lessonStart: lesson.start,
      lessonEnd: lesson.end,
      practiceStart: practice.start,
      practiceEnd: practice.end,
      lessonJoinUrl: lessonEv?.joinUrl ?? null,
      practiceJoinUrl: practiceEv?.joinUrl ?? null,
    };
  });
}

/** Program boundaries derived from the module map (falls back to 12/20/24). */
export function programBounds(windows: ModuleWindow[]) {
  const s1 = windows.filter((w) => (w.module.segment ?? (w.module.order <= 6 ? "SESSION_1" : "SESSION_2")) === "SESSION_1");
  const s2 = windows.filter((w) => (w.module.segment ?? (w.module.order <= 6 ? "SESSION_1" : "SESSION_2")) === "SESSION_2");
  const lastS1Week = Math.max(...s1.map((w) => w.module.practiceWeekNo ?? 12), 12);
  const firstS2Week = s2.length ? Math.min(...s2.map((w) => w.module.lessonWeekNo ?? 21)) : 21;
  const lastWeek = Math.max(...windows.map((w) => w.module.practiceWeekNo ?? 24), lastS1Week);
  return { lastS1Week, firstS2Week, lastWeek, intersessionWeeks: firstS2Week - lastS1Week - 1 };
}

export type CycleState = {
  segment: Segment;
  weekOfProgram: number | null;
  cyclePhase: CyclePhase | null;
  current: ModuleWindow | null;
};

/** Resolve where the participant stands on the program clock. */
export function deriveCycle(cohort: EnrollmentTree["cohort"], now: Date): CycleState {
  const start = new Date(cohort.startDate);
  const end = new Date(cohort.endDate);
  const closesAt = cohort.portalClosesAt ? new Date(cohort.portalClosesAt) : addDays(end, 30);
  const windows = moduleWindows(cohort);
  const bounds = programBounds(windows);

  if (now >= closesAt) return { segment: "CLOSED", weekOfProgram: null, cyclePhase: null, current: null };
  if (now < start) return { segment: "PRE_START", weekOfProgram: null, cyclePhase: null, current: null };

  const week = weekOf(start, now);
  const lastWindow = windows[windows.length - 1];
  if (now > end || (lastWindow && now > lastWindow.practiceEnd && week > bounds.lastWeek)) {
    return { segment: "GRADUATED", weekOfProgram: null, cyclePhase: null, current: null };
  }

  // Intersession: between the last Session 1 practice week and the first
  // Session 2 lesson week.
  if (week > bounds.lastS1Week && week < bounds.firstS2Week) {
    return { segment: "INTERSESSION", weekOfProgram: week, cyclePhase: null, current: null };
  }

  const segment: Segment = week <= bounds.lastS1Week ? "SESSION_1" : "SESSION_2";
  const inSegment = windows.filter(
    (w) => (w.module.segment ?? (w.module.order <= 6 ? "SESSION_1" : "SESSION_2")) === segment,
  );
  // The current module is the first whose practice session hasn't ended.
  const current = inSegment.find((w) => now <= w.practiceEnd) ?? null;
  if (!current) {
    // Tail of a segment (after its last practice, before the next segment
    // begins on the week grid). The cycle has dissolved; the last module
    // stays named on the journey line.
    return {
      segment,
      weekOfProgram: week,
      cyclePhase: "AFTER_PRACTICE",
      current: inSegment[inSegment.length - 1] ?? null,
    };
  }

  // Before the lesson ends the Now card holds the lesson; after it, the Live
  // It stretch runs until the Join card returns as the practice approaches.
  const phase: CyclePhase =
    now <= current.lessonEnd
      ? "BEFORE_LESSON"
      : now.getTime() >= current.practiceStart.getTime() - PRACTICE_APPROACH_MS
        ? "BEFORE_PRACTICE"
        : "LIVE_IT";

  return { segment, weekOfProgram: week, cyclePhase: phase, current };
}

/** Map a preview key onto a synthetic "now" inside the cohort's own schedule. */
export function previewNow(cohort: EnrollmentTree["cohort"], key: PreviewKey): Date {
  const start = new Date(cohort.startDate);
  const end = new Date(cohort.endDate);
  const windows = moduleWindows(cohort);
  const bounds = programBounds(windows);
  const m = (order: number) => windows.find((w) => w.module.order === order) ?? windows[0]!;
  switch (key) {
    case "pre_start":
      return addDays(start, -12);
    case "session_day":
      // Module 2's lesson day, an hour before doors open.
      return new Date(m(2).lessonStart.getTime() - 60 * 60 * 1000);
    case "live_it":
      return addDays(m(3).lessonEnd, 3);
    case "before_practice":
      return new Date(m(3).practiceStart.getTime() - 12 * 60 * 60 * 1000);
    case "intersession":
      // Week 3 of the Intersession.
      return new Date(start.getTime() + (bounds.lastS1Week + 2.5) * WEEK_MS);
    case "graduated":
      return addDays(end, 3);
    case "closed":
      return addDays(cohort.portalClosesAt ? new Date(cohort.portalClosesAt) : addDays(end, 30), 1);
  }
}

export function parsePreview(raw: unknown): PreviewKey | null {
  const keys: PreviewKey[] = [
    "pre_start",
    "session_day",
    "live_it",
    "before_practice",
    "intersession",
    "graduated",
    "closed",
  ];
  return keys.includes(raw as PreviewKey) ? (raw as PreviewKey) : null;
}

/**
 * Sync stored module progress with the schedule: COMPLETED once the module's
 * practice session has passed, AVAILABLE while in flight, LOCKED ahead. The
 * portal never asks the participant to mark anything done — the program's own
 * cadence is the source of truth (and trainer/company aggregates read the
 * same rows).
 */
export async function syncModuleProgress(enr: EnrollmentTree, now = new Date()) {
  const windows = moduleWindows(enr.cohort);
  const byModule = new Map(windows.map((w) => [w.module.id, w]));
  for (const mp of enr.moduleProgress) {
    const w = mp.moduleId ? byModule.get(mp.moduleId) : undefined;
    if (!w) continue;
    const desired =
      now > w.practiceEnd ? "COMPLETED" : now >= w.lessonStart ? "AVAILABLE" : "LOCKED";
    if (mp.status !== desired) {
      await db
        .update(schema.moduleProgress)
        .set({
          status: desired,
          completedAt: desired === "COMPLETED" ? w.practiceEnd : null,
        })
        .where(eq(schema.moduleProgress.id, mp.id));
      mp.status = desired;
      mp.completedAt = desired === "COMPLETED" ? w.practiceEnd : null;
    }
  }
  const cycle = deriveCycle(enr.cohort, now);
  if ((cycle.segment === "GRADUATED" || cycle.segment === "CLOSED") && enr.status === "ACTIVE") {
    await db
      .update(schema.enrollment)
      .set({ status: "COMPLETED", completedAt: new Date(enr.cohort.endDate) })
      .where(eq(schema.enrollment.id, enr.id));
    enr.status = "COMPLETED";
  }
}

/** The Live It window for a module: lesson end → practice end. */
export function liveItWindow(w: ModuleWindow) {
  return { from: w.lessonEnd, to: w.practiceEnd };
}

// ---------------------------------------------------------------------------
// Assembling the home state
// ---------------------------------------------------------------------------

type ReflectionRow = typeof schema.reflection.$inferSelect;

function latest<T extends { createdAt: Date }>(rows: T[]): T | null {
  return rows.length ? rows.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)) : null;
}

function reflectionItem(r: ReflectionRow, moduleTitle: string | null = null) {
  return {
    id: r.id,
    kind: r.kind,
    promptKey: r.promptKey,
    moduleId: r.moduleId,
    moduleTitle,
    body: r.body,
    createdAt: r.createdAt,
  };
}

export async function buildPortalHome(enr: EnrollmentTree, opts?: { preview?: PreviewKey | null }) {
  const realNow = new Date();
  const now = opts?.preview ? previewNow(enr.cohort, opts.preview) : realNow;

  // Keep stored progress aligned with the real clock (not the preview clock).
  await syncModuleProgress(enr, realNow);

  const cohort = enr.cohort;
  const windows = moduleWindows(cohort);
  const bounds = programBounds(windows);
  const cycle = deriveCycle(cohort, now);
  const moduleTitle = new Map(cohort.program.modules.map((m) => [m.id, m.title]));

  // ---- Participant writing (the anchor + the mirror's supply) ----
  const reflections = await db.query.reflection.findMany({
    where: eq(schema.reflection.enrollmentId, enr.id),
    orderBy: [asc(schema.reflection.createdAt)],
  });
  const ofKind = (kind: ReflectionRow["kind"]) => reflections.filter((r) => r.kind === kind);
  const seedBest = latest(ofKind("SEED").filter((r) => r.promptKey === "seed.best_day"));
  const seedYes = latest(ofKind("SEED").filter((r) => r.promptKey === "seed.said_yes"));
  const iAm = latest(ofKind("I_AM"));
  const why = latest(ofKind("LEADERSHIP_WHY"));
  const needsOnboarding = !seedBest || !seedYes;

  const anchor = {
    seeds: [seedBest, seedYes].filter(Boolean).map((r) => reflectionItem(r!)),
    iAm: iAm ? reflectionItem(iAm) : null,
    leadershipWhy: why ? reflectionItem(why) : null,
  };

  // ---- Live It checklist (visible from lesson end through practice end) ----
  const showLiveIt =
    cycle.current && (cycle.cyclePhase === "LIVE_IT" || cycle.cyclePhase === "BEFORE_PRACTICE");
  let liveIt: null | {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
    items: Array<{
      id: string;
      order: number;
      label: string;
      checked: boolean;
      note: string | null;
      checkedAt: Date | null;
    }>;
  } = null;
  if (showLiveIt && cycle.current) {
    const items = await db.query.liveItItem.findMany({
      where: and(eq(schema.liveItItem.moduleId, cycle.current.module.id), eq(schema.liveItItem.active, true)),
      orderBy: [asc(schema.liveItItem.order)],
    });
    const progress = items.length
      ? await db.query.liveItProgress.findMany({
          where: and(
            eq(schema.liveItProgress.enrollmentId, enr.id),
            inArray(
              schema.liveItProgress.itemId,
              items.map((i) => i.id),
            ),
          ),
        })
      : [];
    const byItem = new Map(progress.map((p) => [p.itemId, p]));
    liveIt = {
      moduleId: cycle.current.module.id,
      moduleTitle: cycle.current.module.title,
      moduleOrder: cycle.current.module.order,
      items: items.map((i) => {
        const p = byItem.get(i.id);
        return {
          id: i.id,
          order: i.order,
          label: i.label,
          checked: Boolean(p?.checkedAt),
          note: p?.note ?? null,
          checkedAt: p?.checkedAt ?? null,
        };
      }),
    };
  }

  // ---- Partner presence (signal only — never what they wrote) ----
  const link = await db.query.partnerLink.findFirst({
    where: and(
      eq(schema.partnerLink.cohortId, cohort.id),
      eq(schema.partnerLink.status, "ACTIVE"),
      or(eq(schema.partnerLink.enrollmentAId, enr.id), eq(schema.partnerLink.enrollmentBId, enr.id)),
    ),
  });
  let partner: null | { name: string; checkedInThisWeek: boolean; signal: string | null; threadId: string | null } =
    null;
  const firstPractice = windows[0]?.practiceStart ?? null;
  let partnerPending = false;
  if (link) {
    const otherEnrId = link.enrollmentAId === enr.id ? link.enrollmentBId : link.enrollmentAId;
    const other = await db.query.enrollment.findFirst({
      where: eq(schema.enrollment.id, otherEnrId),
      with: { user: { columns: { id: true, name: true } }, bookings: true },
    });
    if (other?.user) {
      const firstName = (other.user.name ?? "Your partner").split(" ")[0];
      let checkedIn = false;
      let signal: string | null = null;
      if (cycle.current) {
        const win = liveItWindow(cycle.current);
        const partnerChecks = await db.query.liveItProgress.findMany({
          where: eq(schema.liveItProgress.enrollmentId, otherEnrId),
        });
        const recent = partnerChecks.filter(
          (c) => c.checkedAt && c.checkedAt >= win.from && c.checkedAt <= win.to && c.checkedAt <= now,
        );
        checkedIn = recent.length > 0;
        if (checkedIn) {
          const last = recent.sort((a, b) => b.checkedAt!.getTime() - a.checkedAt!.getTime())[0]!;
          const daysAgo = Math.floor((now.getTime() - last.checkedAt!.getTime()) / DAY_MS);
          signal = `${firstName} lived one practice ${daysAgo <= 0 ? "today" : daysAgo === 1 ? "yesterday" : "this week"}`;
        } else {
          signal = cycle.cyclePhase === "BEFORE_LESSON" ? `${firstName} is in this module with you` : null;
        }
      } else if (cycle.segment === "INTERSESSION") {
        const booked = (other.bookings ?? []).find((b) => b.status === "SCHEDULED" || b.status === "RESCHEDULED");
        if (booked) {
          const when = new Date(booked.slot).toLocaleDateString("en-US", { month: "long", day: "numeric" });
          checkedIn = true;
          signal = `${firstName} booked a session for ${when}`;
        } else {
          signal = `${firstName} is in the Intersession with you`;
        }
      }
      // Existing DIRECT thread between the two users, if any (created lazily on first note).
      const threadId = await findDirectThread(enr.userId, other.user.id);
      partner = { name: other.user.name ?? "Your partner", checkedInThisWeek: checkedIn, signal, threadId };
    }
  } else {
    partnerPending = firstPractice ? now < firstPractice : cycle.segment === "PRE_START";
  }

  // ---- Mirror strip (structured writing only, timed to the program) ----
  const closingFor = (order: number) =>
    latest(ofKind("MODULE_CLOSING").filter((r) => moduleOrderOf(cohort, r.moduleId) === order));
  const commitmentFor = (order: number) =>
    latest(ofKind("COMMITMENT").filter((r) => moduleOrderOf(cohort, r.moduleId) === order));

  let mirror: null | { sourceKind: ReflectionRow["kind"]; label: string; body: string; question: string | null } = null;
  if (cycle.segment === "SESSION_1" || cycle.segment === "SESSION_2") {
    const m = cycle.current?.module;
    if (m && cycle.cyclePhase === "BEFORE_LESSON" && m.order > 1) {
      const prev = closingFor(m.order - 1);
      if (prev)
        mirror = {
          sourceKind: "MODULE_CLOSING",
          label: `Before tonight — from your Module ${m.order - 1} closing reflection`,
          body: prev.body,
          question: null,
        };
    } else if (m && (cycle.cyclePhase === "LIVE_IT" || cycle.cyclePhase === "BEFORE_PRACTICE")) {
      const commit = commitmentFor(m.order);
      if (commit)
        mirror = {
          sourceKind: "COMMITMENT",
          label: "Your commitment from the lesson session",
          body: commit.body,
          question: null,
        };
      else {
        const prev = closingFor(m.order - 1);
        if (prev)
          mirror = {
            sourceKind: "MODULE_CLOSING",
            label: `From your Module ${m.order - 1} closing reflection`,
            body: prev.body,
            question: null,
          };
      }
    }
  } else if (cycle.segment === "INTERSESSION" && seedBest) {
    const weeksAgo = Math.max(cycle.weekOfProgram ? cycle.weekOfProgram - 1 : 12, 1);
    mirror = {
      sourceKind: "SEED",
      label: `${numberWord(weeksAgo)} weeks ago you wrote`,
      body: seedBest.body,
      question: "Where did that show up this week?",
    };
  }
  // GRADUATED: no mirror — the day-one seed reflection returns in the anchor
  // itself, once, as the design specifies.

  // ---- Now card: one moment, one action ----
  const shipment = enr.shipment ?? null;
  const closesAt = cohort.portalClosesAt ? new Date(cohort.portalClosesAt) : addDays(new Date(cohort.endDate), 30);
  const workbook = await db.query.resource.findFirst({
    where: and(
      eq(schema.resource.type, "WORKBOOK"),
      eq(schema.resource.status, "PUBLISHED"),
      eq(schema.resource.programId, cohort.programId),
    ),
  });

  type NowCard = Record<string, unknown> & { type: string };
  let nowCard: NowCard;
  switch (cycle.segment) {
    case "PRE_START":
      nowCard = {
        type: "PRE_START",
        cohortStartDate: cohort.startDate,
        workbookUrl: workbook?.url ?? (workbook ? "/portal/materials" : null),
        printStatus: shipment?.status ?? "NOT_REQUESTED",
        printRequestable: (shipment?.status ?? "NOT_REQUESTED") === "NOT_REQUESTED",
      };
      break;
    case "SESSION_1":
    case "SESSION_2": {
      const w = cycle.current!;
      if (cycle.cyclePhase === "LIVE_IT") {
        nowCard = { type: "LIVE_IT", moduleOrder: w.module.order, moduleTitle: w.module.title };
      } else if (cycle.cyclePhase === "AFTER_PRACTICE") {
        // The checklist has dissolved; the next beat is the Intersession or graduation.
        nowCard =
          cycle.segment === "SESSION_1"
            ? intersessionCard(enr, bounds, cycle.weekOfProgram ?? bounds.lastS1Week + 1, now)
            : { type: "GRADUATION", portalClosesAt: closesAt };
      } else {
        const kind = cycle.cyclePhase === "BEFORE_LESSON" ? "LESSON" : "PRACTICE";
        const startAt = kind === "LESSON" ? w.lessonStart : w.practiceStart;
        const endAt = kind === "LESSON" ? w.lessonEnd : w.practiceEnd;
        nowCard = {
          type: "SESSION",
          sessionKind: kind,
          moduleOrder: w.module.order,
          moduleTitle: w.module.title,
          startAt,
          endAt,
          joinUrl: (kind === "LESSON" ? w.lessonJoinUrl : w.practiceJoinUrl) ?? null,
          isToday: sameDay(startAt, now, cohort.timezone),
        };
      }
      break;
    }
    case "INTERSESSION":
      nowCard = intersessionCard(enr, bounds, cycle.weekOfProgram!, now);
      break;
    case "GRADUATED":
      nowCard = { type: "GRADUATION", portalClosesAt: closesAt };
      break;
    case "CLOSED":
      nowCard = { type: "CLOSED", portalClosesAt: closesAt };
      break;
  }

  // ---- Journey line: place, not performance ----
  const journey = buildJourney(cohort, windows, bounds, cycle);
  const journeyLabel =
    cycle.segment === "PRE_START"
      ? "Begin"
      : cycle.segment === "INTERSESSION"
        ? `Intersession · wk ${(cycle.weekOfProgram ?? bounds.lastS1Week + 1) - bounds.lastS1Week}`
        : cycle.segment === "GRADUATED" || cycle.segment === "CLOSED"
          ? "Graduated"
          : cycle.current
            ? `${cycle.current.module.pillar} · ${cycle.current.module.title}`
            : "In training";

  // ---- Gentle prompts (never nagging): I AM after Module 1's lesson; the
  //      lesson-session commitment while the stretch is open. ----
  const m1 = windows.find((w) => w.module.order === 1);
  const prompts = {
    iAm:
      !iAm &&
      (cycle.segment === "SESSION_1" || cycle.segment === "SESSION_2" || cycle.segment === "INTERSESSION") &&
      Boolean(m1 && now > m1.lessonEnd),
    commitment:
      Boolean(cycle.current && (cycle.cyclePhase === "LIVE_IT" || cycle.cyclePhase === "BEFORE_PRACTICE")) &&
      !commitmentFor(cycle.current!.module.order),
  };

  return {
    segment: cycle.segment,
    weekOfProgram: cycle.weekOfProgram,
    cyclePhase: cycle.cyclePhase,
    currentModule: cycle.current?.module ?? null,
    nowCard,
    journey,
    journeyLabel,
    anchor,
    mirror,
    liveIt,
    partner,
    partnerPending,
    welcomeNote: cohort.welcomeNote ?? null,
    trainerName: cohort.trainer?.name ?? null,
    cohortName: cohort.name,
    cohortStartDate: cohort.startDate,
    portalClosesAt: closesAt,
    needsOnboarding,
    prompts,
  };
}

function intersessionCard(
  enr: EnrollmentTree,
  bounds: ReturnType<typeof programBounds>,
  weekOfProgram: number,
  now: Date,
) {
  const active = (enr.bookings ?? []).filter((b) => b.status === "SCHEDULED" || b.status === "RESCHEDULED");
  const upcoming = active
    .map((b) => ({ ...b, slotDate: new Date(b.slot) }))
    .filter((b) => b.slotDate >= now)
    .sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime())[0];
  return {
    type: "INTERSESSION",
    intersessionWeek: Math.min(Math.max(weekOfProgram - bounds.lastS1Week, 1), bounds.intersessionWeeks),
    intersessionWeeks: bounds.intersessionWeeks,
    booking: upcoming
      ? { id: upcoming.id, slot: upcoming.slot, status: upcoming.status, sequence: upcoming.sequence, trainer: upcoming.trainer ?? null }
      : null,
  };
}

function buildJourney(
  cohort: EnrollmentTree["cohort"],
  windows: ModuleWindow[],
  bounds: ReturnType<typeof programBounds>,
  cycle: CycleState,
) {
  const pillars: Array<{ key: "EQ" | "IQ" | "MQ"; wins: ModuleWindow[] }> = (["EQ", "IQ", "MQ"] as const).map(
    (p) => ({ key: p, wins: windows.filter((w) => w.module.pillar === p) }),
  );
  const segs: Array<{ key: string; label: string; fromWeek: number; toWeek: number }> = [];
  for (const p of pillars.filter((p) => p.wins.length)) {
    segs.push({
      key: p.key,
      label: p.key,
      fromWeek: Math.min(...p.wins.map((w) => w.module.lessonWeekNo ?? 1)),
      toWeek: Math.max(...p.wins.map((w) => w.module.practiceWeekNo ?? 24)),
    });
  }
  segs.push({
    key: "INTERSESSION",
    label: "Intersession",
    fromWeek: bounds.lastS1Week + 1,
    toWeek: bounds.firstS2Week - 1,
  });
  segs.sort((a, b) => a.fromWeek - b.fromWeek);

  const week = cycle.weekOfProgram;
  const done = cycle.segment === "GRADUATED" || cycle.segment === "CLOSED";
  return segs.map((s) => {
    let state: "past" | "current" | "future" = "future";
    let progress: number | null = null;
    if (done || (week !== null && week > s.toWeek)) state = "past";
    else if (cycle.segment === "PRE_START") state = "future";
    else if (week !== null && week >= s.fromWeek && week <= s.toWeek) {
      state = "current";
      progress = (week - s.fromWeek + 0.5) / (s.toWeek - s.fromWeek + 1);
    }
    return { key: s.key, label: s.label, state, progress };
  });
}

function moduleOrderOf(cohort: EnrollmentTree["cohort"], moduleId: string | null): number | null {
  if (!moduleId) return null;
  return cohort.program.modules.find((m) => m.id === moduleId)?.order ?? null;
}

function sameDay(a: Date, b: Date, timeZone?: string | null) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(a) === fmt.format(b);
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
function numberWord(n: number) {
  const w = WORDS[n];
  return w ? w[0]!.toUpperCase() + w.slice(1) : String(n);
}

/** Find an existing DIRECT thread between two users (null when none). */
export async function findDirectThread(userA: string, userB: string): Promise<string | null> {
  const rows = await db
    .select({ id: schema.thread.id })
    .from(schema.thread)
    .where(
      and(
        eq(schema.thread.type, "DIRECT"),
        sql`exists (select 1 from ${schema.threadMember} tm where tm.thread_id = ${schema.thread.id} and tm.user_id = ${userA})`,
        sql`exists (select 1 from ${schema.threadMember} tm where tm.thread_id = ${schema.thread.id} and tm.user_id = ${userB})`,
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

/** True once the cohort's portal window has closed (export stays reachable). */
export function isPortalClosed(cohort: { endDate: Date | string; portalClosesAt?: Date | string | null }, now = new Date()) {
  const closesAt = cohort.portalClosesAt ? new Date(cohort.portalClosesAt) : addDays(new Date(cohort.endDate), 30);
  return now >= closesAt;
}
