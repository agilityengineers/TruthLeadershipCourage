/**
 * Seed the TLC database with the demo content that formerly lived in the
 * in-memory `src/data/store.ts`. Uses the SAME stable IDs so links stay valid,
 * and is idempotent (rows conflict-on-id do nothing) so it is safe to re-run.
 *
 * Demo logins (shared password `password123`):
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

  const moduleSpecs = [
    { pillar: "EQ", title: "Self-Awareness" },
    { pillar: "EQ", title: "Self-Trust" },
    { pillar: "EQ", title: "Grounded Presence" },
    { pillar: "EQ", title: "Values & Vision" },
    { pillar: "IQ", title: "Clarity & Expectations" },
    { pillar: "IQ", title: "Hard Conversations" },
    { pillar: "IQ", title: "Accountability" },
    { pillar: "IQ", title: "Building Trust" },
    { pillar: "MQ", title: "Mentoring" },
    { pillar: "MQ", title: "Growing Future Leaders" },
  ] as const;
  const modules = moduleSpecs.map((m, i) => ({
    id: `mod_${i + 1}`,
    programId: program.id,
    pillar: m.pillar as s.Module["pillar"],
    order: i + 1,
    weekNo: i + 1,
    title: m.title,
    summary: `Week ${i + 1} — ${m.title}.`,
    createdAt: now,
    updatedAt: now,
  }));

  // ---- Companies + staff users ----
  const acme = { id: "co_acme", name: "Acme Corp", slug: "acme", billingEmail: "billing@acme.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };
  const northwind = { id: "co_northwind", name: "Northwind Group", slug: "northwind", billingEmail: "ap@northwind.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };
  const meridian = { id: "co_meridian", name: "Meridian Health", slug: "meridian", billingEmail: "finance@meridian.test", logoUrl: null, status: "ACTIVE" as const, createdAt: now, updatedAt: now };

  const tri = { id: "u_tri", email: "tri@thewisdomtri.com", name: "Tri Nguyen", role: "TRAINER" as const, status: "active", title: "Lead Trainer", companyId: null, image: null, phone: null, createdAt: now, updatedAt: now };
  const admin = { id: "u_admin", email: "admin@thewisdomtri.com", name: "TLC Admin", role: "ADMIN" as const, status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };
  const rkim = { id: "u_rkim", email: "rkim@thewisdomtri.com", name: "R. Kim", role: "TRAINER" as const, status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };

  // ---- Cohorts ----
  const fall = { id: "coh_fall", programId: program.id, name: "Fall 2026", slug: "fall-2026", startDate: new Date("2026-08-13T16:00:00Z"), endDate: new Date("2027-02-25T19:00:00Z"), sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles", price: 550000, currency: "usd", capacity: 84, status: "RUNNING" as const, isPrivate: false, trainerId: tri.id, companyId: null, tagline: "Lead with truth. Grow with courage.", description: "Six months of guided leadership growth with a small cohort of peers — weekly live sessions, a physical workbook, and 1:1 coaching across the Truth, Leadership, and Courage pillars.", format: "online", location: "Live on Zoom", createdAt: now, updatedAt: now };
  const spring = { id: "coh_spring", programId: program.id, name: "Spring 2027", slug: "spring-2027", startDate: new Date("2027-03-04T17:00:00Z"), endDate: new Date("2027-09-02T19:00:00Z"), sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles", price: 550000, currency: "usd", capacity: 62, status: "ENROLLING" as const, isPrivate: false, trainerId: tri.id, companyId: null, tagline: "The next chapter of your leadership starts here.", description: "Join the Spring 2027 cohort and move through the full six-month TLC journey alongside a committed group of leaders. Weekly live sessions, a physical workbook, and personal coaching.", format: "online", location: "Live on Zoom", createdAt: now, updatedAt: now };
  const meridianCohort = { id: "coh_meridian", programId: program.id, name: "Meridian — Private", slug: "meridian-private", startDate: new Date("2026-06-04T17:00:00Z"), endDate: new Date("2026-12-03T19:00:00Z"), sessionDay: "Tuesday", sessionTime: "1:00–3:00 PM", timezone: "America/Los_Angeles", price: 0, currency: "usd", capacity: 12, status: "RUNNING" as const, isPrivate: true, trainerId: tri.id, companyId: meridian.id, createdAt: now, updatedAt: now };

  // ---- Fall weekly events ----
  const events = [] as s.InsertEvent[];
  for (let w = 1; w <= 24; w++) {
    const start = addDays(new Date(fall.startDate), (w - 1) * 7);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    const mod = modules[(w - 1) % modules.length];
    events.push({ id: `ev_fall_${w}`, cohortId: fall.id, moduleId: mod?.id ?? null, type: "WEEKLY_SESSION", title: `Week ${w} · ${mod?.title ?? "Session"}`, startAt: start, endAt: end, joinUrl: "https://zoom.us/j/example", location: null, status: "scheduled", weekNo: w, createdAt: now });
  }

  // ---- Participants + enrollments/progress/shipments/payments/bookings ----
  const people = [
    { key: "jordan", email: "jordan@acme.test", name: "Jordan Avery", company: acme, weeks: 7 },
    { key: "maya", email: "maya@acme.test", name: "Maya Rao", company: acme, weeks: 8 },
    { key: "devin", email: "devin@northwind.test", name: "Devin Cole", company: northwind, weeks: 3 },
    { key: "sam", email: "sam@independent.test", name: "Sam Park", company: null as null | typeof acme, weeks: 6 },
  ];

  const users = [tri, admin, rkim] as s.InsertUser[];
  const enrollments = [] as s.InsertEnrollment[];
  const moduleProgress = [] as s.InsertModuleProgress[];
  const shipments = [] as s.InsertShipment[];
  const payments = [] as s.InsertPayment[];
  const bookings = [] as s.InsertCoachingBooking[];

  const shipAddr = { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" };

  for (const p of people) {
    users.push({ id: `u_${p.key}`, email: p.email, name: p.name, role: "PARTICIPANT", status: "active", companyId: p.company?.id ?? null, image: null, title: null, phone: null, createdAt: now, updatedAt: now });
    const enrollment = { id: `enr_${p.key}`, userId: `u_${p.key}`, cohortId: fall.id, companyId: p.company?.id ?? null, seatId: null, status: "ACTIVE" as const, shippingAddress: shipAddr, enrolledAt: new Date("2026-06-20"), completedAt: null, createdAt: now, updatedAt: now };
    enrollments.push(enrollment);
    for (let w = 1; w <= 24; w++) {
      moduleProgress.push({ id: `mp_${p.key}_${w}`, enrollmentId: enrollment.id, weekNo: w, moduleId: modules[(w - 1) % modules.length]?.id ?? null, status: w < p.weeks ? "COMPLETED" : w === p.weeks ? "AVAILABLE" : "LOCKED", completedAt: w < p.weeks ? now : null });
    }
    shipments.push({ id: `ship_${p.key}`, enrollmentId: enrollment.id, status: "PRINTING", carrier: null, tracking: null, address: shipAddr, shippedAt: null, deliveredAt: null, createdAt: now, updatedAt: now });
    payments.push({ id: `pay_${p.key}`, enrollmentId: enrollment.id, companyId: p.company?.id ?? null, processor: "STRIPE", externalId: `seed_u_${p.key}`, amount: 550000, currency: "usd", status: "PAID", couponId: null, raw: null, createdAt: now, updatedAt: now });
    bookings.push({ id: `bk_${p.key}_1`, enrollmentId: enrollment.id, trainerId: tri.id, eventId: null, slot: new Date("2026-11-12T22:00:00Z"), status: "SCHEDULED", notes: null, sequence: 1, createdAt: now });
  }

  users.push({ id: "u_viewer", email: "viewer@acme.test", name: "Acme Manager", role: "COMPANY_VIEWER", status: "active", companyId: acme.id, image: null, title: null, phone: null, createdAt: now, updatedAt: now });

  // ---- Threads / members / messages ----
  const channel = { id: "thr_channel", type: "COHORT_CHANNEL" as const, cohortId: fall.id, title: "Fall 2026 Cohort", createdAt: now, updatedAt: now };
  const direct = { id: "thr_direct", type: "DIRECT" as const, cohortId: null, title: "Jordan ↔ Tri", createdAt: now, updatedAt: now };

  const threadMembers = [] as s.InsertThreadMember[];
  for (const e of enrollments) threadMembers.push({ id: `tm_${channel.id}_${e.userId}`, threadId: channel.id, userId: e.userId!, lastReadAt: null });
  threadMembers.push({ id: `tm_${channel.id}_${tri.id}`, threadId: channel.id, userId: tri.id, lastReadAt: null });
  threadMembers.push({ id: "tm_direct_jordan", threadId: direct.id, userId: "u_jordan", lastReadAt: null });
  threadMembers.push({ id: "tm_direct_tri", threadId: direct.id, userId: tri.id, lastReadAt: null });

  const messages = [
    { id: "msg_channel_1", threadId: channel.id, senderId: tri.id, body: "Welcome to the Fall 2026 cohort! Drop a hello and one thing you want to work on.", attachments: null, createdAt: now },
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
  await ins(s.company, [acme, northwind, meridian]);
  await ins(s.user, users);
  await ins(s.cohort, [fall, spring, meridianCohort]);
  await ins(s.event, events);
  await ins(s.enrollment, enrollments);
  await ins(s.moduleProgress, moduleProgress);
  await ins(s.shipment, shipments);
  await ins(s.payment, payments);
  await ins(s.coachingBooking, bookings);
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
    "[seed] done: %d users, %d cohorts, %d enrollments, %d sections",
    users.length,
    3,
    enrollments.length,
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
