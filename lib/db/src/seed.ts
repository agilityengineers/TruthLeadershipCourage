/**
 * Seed the TLC database with the demo content that formerly lived in the
 * in-memory `src/data/store.ts`. Uses the SAME stable IDs so links stay valid,
 * and is idempotent (rows conflict-on-id do nothing) so it is safe to re-run.
 *
 * Program shape (the "cadence contract" the participant portal follows):
 *   Session 1 — Modules 1–6, weeks 1–12 (two-week heartbeat per module:
 *   lesson session → Live It stretch → practice session), then an 8-week
 *   Intersession (weeks 13–20, coaching 1:1s), then Session 2 — Modules 7–8,
 *   weeks 21–24, closing with graduation. The portal closes 30 days later.
 *
 * Demo accounts (seeded with no password hash — sign in only after a password
 * is set through the admin invite / set-password flow):
 *   admin@thewisdomtri.com  (ADMIN)
 *   tri@thewisdomtri.com    (TRAINER)
 *   jordan@acme.test        (PARTICIPANT)
 *   viewer@acme.test        (COMPANY_VIEWER)
 */
import { db, pool } from "./index";
import * as s from "./schema";
import { SECTIONS } from "@workspace/site-content";

const PILLAR_COLOR: Record<string, string> = { EQ: "#024794", IQ: "#262161", MQ: "#662d91" };

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(base: Date, weeks: number) {
  return addDays(base, weeks * 7);
}

/** Month-and-year label for a date (e.g. "August 2026"), stable across zones. */
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const cohortSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/**
 * A demo date `days` from `base`, pinned to 16:00 UTC (~9am Pacific). When a
 * `weekday` (0=Sun…6=Sat) is given, snaps FORWARD to it so a cohort's kickoff
 * lands on its advertised session day — used only for future dates, where the
 * ±6-day snap can't disturb a running cohort's derived week number. Keeping
 * every demo date relative to seed time means there's always a cohort mid-run
 * and one opening soon, whenever the database is seeded.
 */
function demoDate(base: Date, days: number, weekday?: number) {
  const d = addDays(base, days);
  if (weekday !== undefined) d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7));
  d.setUTCHours(16, 0, 0, 0);
  return d;
}

/** Total program length in weeks: Session 1 (12) + Intersession (8) + Session 2 (4). */
const PROGRAM_WEEKS = 24;

async function seed() {
  const now = new Date();

  // ---- Program / assessment / questions / modules ----
  const program = {
    id: "prog_tlc",
    name: "TLC",
    slug: "tlc",
    description: "Truth · Leadership · Courage — the Wisdom Tri flagship leadership program.",
    createdAt: now,
    updatedAt: now,
  };

  const assessment = { id: "asmt_tlc", programId: program.id, title: "Leadership Assessment", createdAt: now };

  const questionSpecs = [
    { theme: "Self-leadership", pillar: "EQ", prompt: "Under pressure, I lead from a grounded, steady place — not a reactive one.", benefit: "Lead from a steadier, grounded place and build deeper self-trust." },
    { theme: "Communication", pillar: "IQ", prompt: "My team is clear on what's expected of them — and why it matters.", benefit: "Create clarity and clear expectations so execution holds." },
    { theme: "Conflict", pillar: "IQ", prompt: "When a hard conversation is needed, I prepare for it and hold it with confidence.", benefit: "Prepare for and hold hard conversations with ease." },
    { theme: "Accountability", pillar: "IQ", prompt: "Commitments on my team are owned and followed through — without me chasing.", benefit: "Raise team accountability and engagement — without chasing." },
    { theme: "Developing others", pillar: "MQ", prompt: "I actively mentor and grow the next generation of leaders around me.", benefit: "Mentor and grow future leaders; build an employee-centered culture." },
  ] as const;
  const questions = questionSpecs.map((q, i) => ({
    id: `q${i + 1}`,
    assessmentId: assessment.id,
    order: i + 1,
    theme: q.theme,
    pillar: q.pillar as s.Question["pillar"],
    color: PILLAR_COLOR[q.pillar],
    prompt: q.prompt,
    benefit: q.benefit,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  // 8 modules on the two-week heartbeat. Modules 1–6 (EQ then IQ) fill
  // Session 1 across weeks 1–12; weeks 13–20 are the Intersession; modules
  // 7–8 (MQ) fill Session 2 across weeks 21–24. Titles are working names
  // pending the canonical workbook list — "Be Wise" (M2) and "Be Bold" (M3)
  // come from the home-screen design doc; the rest follow the brand model's
  // facet language.
  const moduleSpecs = [
    { pillar: "EQ", segment: "SESSION_1", title: "Be You", summary: "Meet yourself on your best day — and name what gets in the way.", anchorLine: "Your best day is data, not accident." },
    { pillar: "EQ", segment: "SESSION_1", title: "Be Wise", summary: "Read the room and yourself; respond instead of react.", anchorLine: "Wisdom is pausing long enough to choose." },
    { pillar: "EQ", segment: "SESSION_1", title: "Be Bold", summary: "Stay with discomfort long enough to lead through it.", anchorLine: "Courage is staying in the room." },
    { pillar: "IQ", segment: "SESSION_1", title: "Connect Authentically", summary: "Build the trust that makes hard things sayable.", anchorLine: "People follow leaders who see them." },
    { pillar: "IQ", segment: "SESSION_1", title: "Drive Collaboration", summary: "Set expectations that hold without chasing.", anchorLine: "Clarity is kindness." },
    { pillar: "IQ", segment: "SESSION_1", title: "Build Unity", summary: "Hold the line on accountability with care.", anchorLine: "Teams repeat what leaders tolerate." },
    { pillar: "MQ", segment: "SESSION_2", title: "Guide Impact", summary: "Mentor the next generation of leaders around you.", anchorLine: "Leadership is measured in other people's growth." },
    { pillar: "MQ", segment: "SESSION_2", title: "Inspire Potential", summary: "Turn your growth into a system that outlasts the program.", anchorLine: "Build leaders who build leaders." },
  ] as const;
  const modules = moduleSpecs.map((m, i) => {
    // M1–M6: lesson weeks 1,3,5,7,9,11. M7–M8: lesson weeks 21,23 (after the
    // 8-week Intersession that follows week 12).
    const lessonWeekNo = i < 6 ? i * 2 + 1 : 21 + (i - 6) * 2;
    return {
      id: `mod_${i + 1}`,
      programId: program.id,
      pillar: m.pillar as s.Module["pillar"],
      order: i + 1,
      weekNo: lessonWeekNo,
      segment: m.segment as s.Module["segment"],
      lessonWeekNo,
      practiceWeekNo: lessonWeekNo + 1,
      title: m.title,
      summary: m.summary,
      anchorLine: m.anchorLine,
      createdAt: now,
      updatedAt: now,
    };
  });

  // The workbook's "Between Sessions" practices, three per module. These feed
  // the Live It checklist during each module's stretch.
  const liveItSpecs: Record<number, readonly string[]> = {
    1: [
      "Notice one best-day moment and write down what triggered it",
      "Ask one teammate what they need more of from you",
      "Two quiet minutes before your first meeting, three mornings",
    ],
    2: [
      "Pause three seconds before answering in one meeting",
      "Name the story you're telling yourself, out loud, once",
      "End one day by writing what you chose not to react to",
    ],
    3: [
      "Name one discomfort and stay with it 60 seconds",
      "Use the Boldness Loop before one hard conversation",
      "Sacred Council · five quiet minutes, three mornings",
    ],
    4: [
      "Open one 1:1 with a personal check-in, no agenda",
      "Reflect back what you heard before you respond, twice",
      "Thank one person specifically for how they worked",
    ],
    5: [
      "Restate one expectation as outcome, why, and when",
      "Invite the quietest voice in one meeting to go first",
      "Replace one status chase with a clarity question",
    ],
    6: [
      "Name one commitment that's slipping and reset it without blame",
      "Hold one accountability conversation from care, not heat",
      "Close one meeting by asking what we're not saying",
    ],
    7: [
      "Ask one person about their growth edge and just listen",
      "Hand one decision down with context, then stay out",
      "Tell one future leader what you see in them",
    ],
    8: [
      "Draft one page of your Personal Leadership Operating System",
      "Share your 90-day commitment with your partner",
      "Choose the one practice you'll keep after graduation",
    ],
  };
  const liveItItems = modules.flatMap((m) =>
    (liveItSpecs[m.order] ?? []).map((label, j) => ({
      id: `lii_${m.order}_${j + 1}`,
      moduleId: m.id,
      order: j + 1,
      label,
      active: true,
      createdAt: now,
      updatedAt: now,
    })),
  );

  // ---- Companies + staff users ----
  const acme = { id: "co_acme", name: "Acme Corp", slug: "acme", billingEmail: "billing@acme.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };
  const northwind = { id: "co_northwind", name: "Northwind Group", slug: "northwind", billingEmail: "ap@northwind.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };
  const meridian = { id: "co_meridian", name: "Meridian Health", slug: "meridian", billingEmail: "finance@meridian.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };

  const tri = { id: "u_tri", email: "tri@thewisdomtri.com", name: "Tri Nguyen", role: "TRAINER" as const, status: "active", title: "Lead Trainer", companyId: null, image: null, phone: null, createdAt: now, updatedAt: now };
  const admin = { id: "u_admin", email: "admin@thewisdomtri.com", name: "TLC Admin", role: "ADMIN" as const, status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };
  const rkim = { id: "u_rkim", email: "rkim@thewisdomtri.com", name: "R. Kim", role: "TRAINER" as const, status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };

  // ---- Cohorts (dates relative to seed time so the demo always shows a live
  //      cohort mid-program and a soon-to-start cohort open for enrollment) ----
  // The active cohort starts ~45 days ago so its date-derived "current week"
  // lands mid Module 4 (week 7 = M4 lesson week) — the demo participants sit
  // in the Live It stretch with the module's checklist open.
  // Meridian stays RUNNING but starts later than the active cohort so it never
  // becomes the trainer's earliest-start "primary" cohort.
  const fallStart = demoDate(now, -45);
  const springStart = demoDate(now, 42, 4); // ~6 weeks out, snapped to a Thursday
  const meridianStart = demoDate(now, -21);
  const fallName = MONTH_YEAR.format(fallStart);
  const springName = MONTH_YEAR.format(springStart);

  // The trainer's welcome note, shown in the portal's seed state before day one.
  const welcomeNote =
    "You're not here to become someone new. You're here to return to the leader you already are on your best day. See you soon.";

  // startDate/endDate plus the three phases of the cadence contract —
  // Session 1 (weeks 1–12), Intersession (weeks 13–20), Session 2 (weeks
  // 21–24) — and the portal close 30 days after the program ends.
  const cohortDates = (start: Date) => ({
    startDate: start,
    endDate: addWeeks(start, PROGRAM_WEEKS),
    session1StartDate: start,
    session1EndDate: addWeeks(start, 12),
    intersessionStartDate: addWeeks(start, 12),
    intersessionEndDate: addWeeks(start, 20),
    session2StartDate: addWeeks(start, 20),
    session2EndDate: addWeeks(start, PROGRAM_WEEKS),
    portalClosesAt: addDays(addWeeks(start, PROGRAM_WEEKS), 30),
  });

  const fall = { id: "coh_fall", programId: program.id, name: fallName, slug: cohortSlug(fallName), ...cohortDates(fallStart), sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles", price: 550000, currency: "usd", capacity: 84, status: "RUNNING" as const, isPrivate: false, trainerId: tri.id, companyId: null, tagline: "Lead with truth. Grow with courage.", description: "Six months of guided leadership growth with a small cohort of peers — live sessions on a two-week heartbeat, a physical workbook, and 1:1 coaching across the Truth, Leadership, and Courage pillars.", format: "online", location: "Live on Zoom", welcomeNote, createdAt: now, updatedAt: now };
  const spring = { id: "coh_spring", programId: program.id, name: springName, slug: cohortSlug(springName), ...cohortDates(springStart), enrollByDate: demoDate(now, 21), sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles", price: 550000, currency: "usd", capacity: 62, status: "ENROLLING" as const, isPrivate: false, trainerId: tri.id, companyId: null, tagline: "The next chapter of your leadership starts here.", description: "Reserve your seat in the next TLC cohort and move through the full six-month journey alongside a committed group of leaders — live sessions, a physical workbook, and personal 1:1 coaching.", format: "online", location: "Live on Zoom", welcomeNote, createdAt: now, updatedAt: now };
  const meridianCohort = { id: "coh_meridian", programId: program.id, name: "Meridian — Private", slug: "meridian-private", ...cohortDates(meridianStart), sessionDay: "Tuesday", sessionTime: "1:00–3:00 PM", timezone: "America/Los_Angeles", price: 0, currency: "usd", capacity: 12, status: "RUNNING" as const, isPrivate: true, trainerId: tri.id, companyId: meridian.id, welcomeNote, createdAt: now, updatedAt: now };

  // ---- Fall session events: the two-week heartbeat made concrete ----
  // Each module gets a LESSON_SESSION and a PRACTICE_SESSION on the cohort's
  // session day; the Intersession (weeks 13–20) has no group sessions; the
  // program closes with a GRADUATION event at the end of week 24.
  const events = [] as s.InsertEvent[];
  const sessionStart = (start: Date, weekNo: number) => addDays(new Date(start), (weekNo - 1) * 7);
  const withEnd = (start: Date, hours: number) => {
    const end = new Date(start);
    end.setHours(end.getHours() + hours);
    return end;
  };
  for (const m of modules) {
    const lessonAt = sessionStart(fall.startDate, m.lessonWeekNo);
    const practiceAt = sessionStart(fall.startDate, m.practiceWeekNo);
    events.push({ id: `ev_fall_m${m.order}_lesson`, cohortId: fall.id, moduleId: m.id, type: "LESSON_SESSION", title: `Module ${m.order} · ${m.title} — Lesson Session`, startAt: lessonAt, endAt: withEnd(lessonAt, 2), joinUrl: "https://zoom.us/j/example", location: null, status: "scheduled", weekNo: m.lessonWeekNo, createdAt: now });
    events.push({ id: `ev_fall_m${m.order}_practice`, cohortId: fall.id, moduleId: m.id, type: "PRACTICE_SESSION", title: `Module ${m.order} · ${m.title} — Practice Session`, startAt: practiceAt, endAt: withEnd(practiceAt, 2), joinUrl: "https://zoom.us/j/example", location: null, status: "scheduled", weekNo: m.practiceWeekNo, createdAt: now });
  }
  const gradAt = sessionStart(fall.startDate, PROGRAM_WEEKS + 1);
  events.push({ id: "ev_fall_graduation", cohortId: fall.id, moduleId: null, type: "GRADUATION", title: "Graduation", startAt: gradAt, endAt: withEnd(gradAt, 2), joinUrl: "https://zoom.us/j/example", location: null, status: "scheduled", weekNo: PROGRAM_WEEKS, createdAt: now });

  // ---- Participants + enrollments/progress/shipments/payments/bookings ----
  const people = [
    { key: "jordan", email: "jordan@acme.test", name: "Jordan Avery", company: acme },
    { key: "maya", email: "maya@acme.test", name: "Maya Rao", company: acme },
    { key: "devin", email: "devin@northwind.test", name: "Devin Cole", company: northwind },
    { key: "sam", email: "sam@independent.test", name: "Sam Park", company: null as null | typeof acme },
  ];

  const users = [tri, admin, rkim] as s.InsertUser[];
  const enrollments = [] as s.InsertEnrollment[];
  const moduleProgress = [] as s.InsertModuleProgress[];
  const shipments = [] as s.InsertShipment[];
  const payments = [] as s.InsertPayment[];
  const bookings = [] as s.InsertCoachingBooking[];

  const shipAddr = { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" };

  // Completion follows the program schedule (the cadence contract): a module
  // is COMPLETED once its practice session has passed, AVAILABLE while in
  // progress, LOCKED ahead. ~45 days in = week 7 = Module 4 in flight.
  const currentWeekNo = Math.min(Math.max(Math.floor(45 / 7) + 1, 1), PROGRAM_WEEKS);

  for (const p of people) {
    users.push({ id: `u_${p.key}`, email: p.email, name: p.name, role: "PARTICIPANT", status: "active", companyId: p.company?.id ?? null, image: null, title: null, phone: null, createdAt: now, updatedAt: now });
    const enrollment = { id: `enr_${p.key}`, userId: `u_${p.key}`, cohortId: fall.id, companyId: p.company?.id ?? null, seatId: null, status: "ACTIVE" as const, shippingAddress: shipAddr, enrolledAt: addDays(fallStart, -7), completedAt: null, createdAt: now, updatedAt: now };
    enrollments.push(enrollment);
    for (const m of modules) {
      const status = m.practiceWeekNo < currentWeekNo ? "COMPLETED" : m.lessonWeekNo <= currentWeekNo ? "AVAILABLE" : "LOCKED";
      moduleProgress.push({ id: `mp_${p.key}_m${m.order}`, enrollmentId: enrollment.id, weekNo: m.lessonWeekNo, moduleId: m.id, status, completedAt: status === "COMPLETED" ? sessionStart(fall.startDate, m.practiceWeekNo) : null });
    }
    payments.push({ id: `pay_${p.key}`, enrollmentId: enrollment.id, companyId: p.company?.id ?? null, processor: "STRIPE", externalId: `seed_u_${p.key}`, amount: 550000, currency: "usd", status: "PAID", couponId: null, raw: null, createdAt: now, updatedAt: now });
  }

  // Printed workbooks are requested, not automatic: Jordan asked for one
  // (printing), Devin's arrived, Maya and Sam use the digital copy.
  shipments.push({ id: "ship_jordan", enrollmentId: "enr_jordan", status: "PRINTING", carrier: null, tracking: null, address: shipAddr, requestedAt: addDays(fallStart, -6), shippedAt: null, deliveredAt: null, createdAt: now, updatedAt: now });
  shipments.push({ id: "ship_maya", enrollmentId: "enr_maya", status: "NOT_REQUESTED", carrier: null, tracking: null, address: shipAddr, requestedAt: null, shippedAt: null, deliveredAt: null, createdAt: now, updatedAt: now });
  shipments.push({ id: "ship_devin", enrollmentId: "enr_devin", status: "DELIVERED", carrier: "UPS", tracking: "1Z999AA10123456784", address: shipAddr, requestedAt: addDays(fallStart, -6), shippedAt: addDays(fallStart, -3), deliveredAt: addDays(fallStart, 1), createdAt: now, updatedAt: now });
  shipments.push({ id: "ship_sam", enrollmentId: "enr_sam", status: "NOT_REQUESTED", carrier: null, tracking: null, address: shipAddr, requestedAt: null, shippedAt: null, deliveredAt: null, createdAt: now, updatedAt: now });

  // Intersession coaching 1:1s (weeks 13–20). Maya, Devin, and Sam have booked
  // theirs; Jordan hasn't yet — the Intersession home state shows the booking
  // card, and Jordan's partner row shows Maya's booking as a quiet nudge.
  const intersessionStart = addWeeks(fallStart, 12);
  bookings.push({ id: "bk_maya_1", enrollmentId: "enr_maya", trainerId: tri.id, eventId: null, slot: addDays(intersessionStart, 9), status: "SCHEDULED", notes: null, sequence: 1, createdAt: now });
  bookings.push({ id: "bk_devin_1", enrollmentId: "enr_devin", trainerId: tri.id, eventId: null, slot: addDays(intersessionStart, 16), status: "SCHEDULED", notes: null, sequence: 1, createdAt: now });
  bookings.push({ id: "bk_sam_1", enrollmentId: "enr_sam", trainerId: tri.id, eventId: null, slot: addDays(intersessionStart, 11), status: "SCHEDULED", notes: null, sequence: 1, createdAt: now });

  users.push({ id: "u_viewer", email: "viewer@acme.test", name: "Acme Manager", role: "COMPANY_VIEWER", status: "active", companyId: acme.id, image: null, title: null, phone: null, createdAt: now, updatedAt: now });

  // ---- Accountability partners (chosen by the first practice session) ----
  const partnerLinks = [
    { id: "plk_jordan_maya", cohortId: fall.id, enrollmentAId: "enr_jordan", enrollmentBId: "enr_maya", status: "ACTIVE" as const, createdBy: "u_jordan", createdAt: now, updatedAt: now },
    { id: "plk_devin_sam", cohortId: fall.id, enrollmentAId: "enr_devin", enrollmentBId: "enr_sam", status: "ACTIVE" as const, createdBy: "u_devin", createdAt: now, updatedAt: now },
  ] as s.InsertPartnerLink[];

  // ---- Participant writing (the mirror's content supply) ----
  // Append-only reflections: the seed answers from account creation, I AM
  // versions, the Leadership Why, per-module commitments and closing
  // reflections. Only ever shown to the participant who wrote them.
  const lessonDate = (m: (typeof modules)[number]) => sessionStart(fall.startDate, m.lessonWeekNo);
  const practiceDate = (m: (typeof modules)[number]) => sessionStart(fall.startDate, m.practiceWeekNo);
  const reflections = [
    // Jordan — the primary demo persona (mirrors the design mockups).
    { id: "refl_jordan_seed_1", enrollmentId: "enr_jordan", kind: "SEED" as const, promptKey: "seed.best_day", moduleId: null, body: "On my best day I listen first, stay calm under pressure, and my team leaves clearer than they came in.", createdAt: addDays(fallStart, -14) },
    { id: "refl_jordan_seed_2", enrollmentId: "enr_jordan", kind: "SEED" as const, promptKey: "seed.said_yes", moduleId: null, body: "My COO told me the team walks on eggshells around me. I don't want that to be true.", createdAt: addDays(fallStart, -14) },
    { id: "refl_jordan_iam_1", enrollmentId: "enr_jordan", kind: "I_AM" as const, promptKey: null, moduleId: "mod_1", body: "I am a grounded leader who leads with truth.", createdAt: addDays(lessonDate(modules[0]!), 1) },
    { id: "refl_jordan_iam_2", enrollmentId: "enr_jordan", kind: "I_AM" as const, promptKey: null, moduleId: "mod_2", body: "I am a grounded leader who leads with truth and care.", createdAt: addDays(lessonDate(modules[1]!), 2) },
    { id: "refl_jordan_why_1", enrollmentId: "enr_jordan", kind: "LEADERSHIP_WHY" as const, promptKey: null, moduleId: "mod_3", body: "So the people I lead go home better than they arrived.", createdAt: addDays(lessonDate(modules[2]!), 1) },
    { id: "refl_jordan_close_m1", enrollmentId: "enr_jordan", kind: "MODULE_CLOSING" as const, promptKey: null, moduleId: "mod_1", body: "I noticed I interrupt when I'm anxious. When I slow down, my team steps up.", createdAt: practiceDate(modules[0]!) },
    { id: "refl_jordan_close_m2", enrollmentId: "enr_jordan", kind: "MODULE_CLOSING" as const, promptKey: null, moduleId: "mod_2", body: "The pause is available to me any time I remember to want it.", createdAt: practiceDate(modules[1]!) },
    { id: "refl_jordan_close_m3", enrollmentId: "enr_jordan", kind: "MODULE_CLOSING" as const, promptKey: null, moduleId: "mod_3", body: "Boldness isn't volume. It's staying in the room when it's uncomfortable.", createdAt: practiceDate(modules[2]!) },
    { id: "refl_jordan_commit_m3", enrollmentId: "enr_jordan", kind: "COMMITMENT" as const, promptKey: null, moduleId: "mod_3", body: "This week I will ask for the decision I've been avoiding.", createdAt: lessonDate(modules[2]!) },
    { id: "refl_jordan_commit_m4", enrollmentId: "enr_jordan", kind: "COMMITMENT" as const, promptKey: null, moduleId: "mod_4", body: "This week I will open my 1:1s by actually asking how people are.", createdAt: lessonDate(modules[3]!) },
    // Maya — Jordan's accountability partner.
    { id: "refl_maya_seed_1", enrollmentId: "enr_maya", kind: "SEED" as const, promptKey: "seed.best_day", moduleId: null, body: "On my best day I make space for other people's ideas and decide without drama.", createdAt: addDays(fallStart, -12) },
    { id: "refl_maya_seed_2", enrollmentId: "enr_maya", kind: "SEED" as const, promptKey: "seed.said_yes", moduleId: null, body: "I keep getting told I'm 'so calm' while I quietly burn out. Something has to change.", createdAt: addDays(fallStart, -12) },
    { id: "refl_maya_iam_1", enrollmentId: "enr_maya", kind: "I_AM" as const, promptKey: null, moduleId: "mod_1", body: "I am a clear-eyed leader who asks for what the work needs.", createdAt: addDays(lessonDate(modules[0]!), 1) },
  ] as s.InsertReflection[];

  // ---- Live It progress (feeds the checklist and the partner signal) ----
  // Module 4 is in flight: Jordan has lived one practice (with the one-line
  // noticing); Maya practiced yesterday, which powers Jordan's partner row.
  const liveItProgress = [
    { id: "lip_jordan_m4_1", enrollmentId: "enr_jordan", itemId: "lii_4_1", checkedAt: addDays(now, -2), note: "Asked about her weekend first. The whole meeting went differently.", createdAt: addDays(now, -2), updatedAt: addDays(now, -2) },
    { id: "lip_maya_m4_1", enrollmentId: "enr_maya", itemId: "lii_4_2", checkedAt: addDays(now, -1), note: "Repeated his point back before answering. He visibly relaxed.", createdAt: addDays(now, -1), updatedAt: addDays(now, -1) },
  ] as s.InsertLiveItProgress[];

  // ---- Threads / members / messages ----
  const channel = { id: "thr_channel", type: "COHORT_CHANNEL" as const, cohortId: fall.id, title: `${fall.name} Cohort`, createdAt: now, updatedAt: now };
  const direct = { id: "thr_direct", type: "DIRECT" as const, cohortId: null, title: "Jordan ↔ Tri", createdAt: now, updatedAt: now };

  const threadMembers = [] as s.InsertThreadMember[];
  for (const e of enrollments) threadMembers.push({ id: `tm_${channel.id}_${e.userId}`, threadId: channel.id, userId: e.userId!, lastReadAt: null });
  threadMembers.push({ id: `tm_${channel.id}_${tri.id}`, threadId: channel.id, userId: tri.id, lastReadAt: null });
  threadMembers.push({ id: "tm_direct_jordan", threadId: direct.id, userId: "u_jordan", lastReadAt: null });
  threadMembers.push({ id: "tm_direct_tri", threadId: direct.id, userId: tri.id, lastReadAt: null });

  const messages = [
    { id: "msg_channel_1", threadId: channel.id, senderId: tri.id, body: `Welcome to the ${fall.name} cohort! Drop a hello and one thing you want to work on.`, attachments: null, createdAt: now },
    { id: "msg_direct_1", threadId: direct.id, senderId: tri.id, body: "Hi Jordan — looking forward to our first 1:1.", attachments: null, createdAt: now },
  ] as s.InsertMessage[];

  const emailTemplates = [
    { id: "tpl_welcome", name: "Welcome", subject: "Welcome to TLC — {{cohortName}}", html: "<p>Welcome {{firstName}}! Your TLC journey begins soon.</p>", variables: null, scope: "SYSTEM" as const, createdAt: now, updatedAt: now },
    { id: "tpl_weekly", name: "Weekly reminder", subject: "This week in TLC: {{moduleTitle}}", html: "<p>Hi {{firstName}}, your session is {{sessionTime}}.</p>", variables: null, scope: "TRAINER" as const, createdAt: now, updatedAt: now },
  ];

  // ---- Insert in dependency order, idempotently ----
  const ins = async <T extends { id?: unknown }>(table: any, rows: T[]) => {
    if (rows.length) await db.insert(table).values(rows as any).onConflictDoNothing();
  };

  await ins(s.program, [program]);
  await ins(s.assessment, [assessment]);
  await ins(s.question, questions);
  await ins(s.module, modules);
  await ins(s.liveItItem, liveItItems);
  await ins(s.company, [acme, northwind, meridian]);
  await ins(s.user, users);
  await ins(s.cohort, [fall, spring, meridianCohort]);
  await ins(s.event, events);
  await ins(s.enrollment, enrollments);
  await ins(s.moduleProgress, moduleProgress);
  await ins(s.shipment, shipments);
  await ins(s.payment, payments);
  await ins(s.coachingBooking, bookings);
  await ins(s.partnerLink, partnerLinks);
  await ins(s.reflection, reflections);
  await ins(s.liveItProgress, liveItProgress);
  await ins(s.thread, [channel, direct]);
  await ins(s.threadMember, threadMembers);
  await ins(s.message, messages);
  await ins(s.emailTemplate, emailTemplates);

  // ---- Editable marketing sections (one row per registry section) ----
  // Stable ids keyed off the section key keep this idempotent; onConflictDoNothing
  // means re-seeding never clobbers an admin's saved content or visibility.
  const siteSections = SECTIONS.map((sec) => ({
    id: `sec_${sec.key.replace(/[^a-zA-Z0-9]/g, "_")}`,
    key: sec.key,
    page: sec.page,
    label: sec.label,
    order: sec.order,
    visible: true,
    content: sec.default,
    createdAt: now,
    updatedAt: now,
  }));
  await ins(s.siteSection, siteSections);

  console.info(
    "[seed] done: %d users, %d cohorts, %d enrollments, %d modules, %d sections",
    users.length,
    3,
    enrollments.length,
    modules.length,
    siteSections.length,
  );
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] failed", err);
    return pool.end().finally(() => process.exit(1));
  });
