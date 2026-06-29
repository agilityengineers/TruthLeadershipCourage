/**
 * In-memory data store seeded to mirror `prisma/seed.ts`. This replaces the
 * Postgres/Prisma database for the client-side migration. Tables are plain
 * arrays keyed by Prisma model accessor name; the query engine in
 * `@/lib/db` runs Prisma-compatible reads/writes against them.
 *
 * Demo logins (all role rows exist): admin@thewisdomtri.com (ADMIN),
 * tri@thewisdomtri.com (TRAINER), jordan@acme.test (PARTICIPANT),
 * viewer@acme.test (COMPANY_VIEWER). Password for all: password123.
 */

type Row = Record<string, any>;

export type Store = Record<string, Row[]>;

const PILLAR_COLOR: Record<string, string> = { EQ: "#024794", IQ: "#262161", MQ: "#662d91" };

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function build(): Store {
  const now = new Date();

  const program: Row = {
    id: "prog_tlc",
    name: "TLC",
    slug: "tlc",
    description: "Truth · Leadership · Courage — the Wisdom Tri flagship leadership program.",
    createdAt: now,
    updatedAt: now,
  };

  const assessment: Row = {
    id: "asmt_tlc",
    programId: program.id,
    title: "Leadership Assessment",
    createdAt: now,
  };

  const questionSpecs = [
    { theme: "Self-leadership", pillar: "EQ", prompt: "Under pressure, I lead from a grounded, steady place — not a reactive one.", benefit: "Lead from a steadier, grounded place and build deeper self-trust." },
    { theme: "Communication", pillar: "IQ", prompt: "My team is clear on what's expected of them — and why it matters.", benefit: "Create clarity and clear expectations so execution holds." },
    { theme: "Conflict", pillar: "IQ", prompt: "When a hard conversation is needed, I prepare for it and hold it with confidence.", benefit: "Prepare for and hold hard conversations with ease." },
    { theme: "Accountability", pillar: "IQ", prompt: "Commitments on my team are owned and followed through — without me chasing.", benefit: "Raise team accountability and engagement — without chasing." },
    { theme: "Developing others", pillar: "MQ", prompt: "I actively mentor and grow the next generation of leaders around me.", benefit: "Mentor and grow future leaders; build an employee-centered culture." },
  ];
  const question: Row[] = questionSpecs.map((q, i) => ({
    id: `q${i + 1}`,
    assessmentId: assessment.id,
    order: i + 1,
    theme: q.theme,
    pillar: q.pillar,
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
  ];
  const moduleRows: Row[] = moduleSpecs.map((m, i) => ({
    id: `mod_${i + 1}`,
    programId: program.id,
    pillar: m.pillar,
    order: i + 1,
    weekNo: i + 1,
    title: m.title,
    summary: `Week ${i + 1} — ${m.title}.`,
  }));

  const tri: Row = { id: "u_tri", email: "tri@thewisdomtri.com", name: "Tri Nguyen", role: "TRAINER", status: "active", title: "Lead Trainer", companyId: null, image: null, phone: null, createdAt: now, updatedAt: now };
  const admin: Row = { id: "u_admin", email: "admin@thewisdomtri.com", name: "TLC Admin", role: "ADMIN", status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };
  const rkim: Row = { id: "u_rkim", email: "rkim@thewisdomtri.com", name: "R. Kim", role: "TRAINER", status: "active", companyId: null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };

  const acme: Row = { id: "co_acme", name: "Acme Corp", slug: "acme", billingEmail: "billing@acme.test", logoUrl: null, status: "ACTIVE", createdAt: now, updatedAt: now };
  const northwind: Row = { id: "co_northwind", name: "Northwind Group", slug: "northwind", billingEmail: "ap@northwind.test", logoUrl: null, status: "ACTIVE", createdAt: now, updatedAt: now };
  const meridian: Row = { id: "co_meridian", name: "Meridian Health", slug: "meridian", billingEmail: "finance@meridian.test", logoUrl: null, status: "ACTIVE", createdAt: now, updatedAt: now };

  const fall: Row = {
    id: "coh_fall", programId: program.id, name: "Fall 2026", slug: "fall-2026",
    startDate: new Date("2026-08-13T16:00:00Z"), endDate: new Date("2027-02-25T19:00:00Z"),
    sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles",
    price: 550000, currency: "usd", capacity: 84, status: "RUNNING", isPrivate: false,
    trainerId: tri.id, companyId: null, createdAt: now, updatedAt: now,
  };
  const spring: Row = {
    id: "coh_spring", programId: program.id, name: "Spring 2027", slug: "spring-2027",
    startDate: new Date("2027-03-04T17:00:00Z"), endDate: new Date("2027-09-02T19:00:00Z"),
    sessionDay: "Thursday", sessionTime: "9:00–11:00 AM", timezone: "America/Los_Angeles",
    price: 550000, currency: "usd", capacity: 62, status: "ENROLLING", isPrivate: false,
    trainerId: tri.id, companyId: null, createdAt: now, updatedAt: now,
  };
  const meridianCohort: Row = {
    id: "coh_meridian", programId: program.id, name: "Meridian — Private", slug: "meridian-private",
    startDate: new Date("2026-06-04T17:00:00Z"), endDate: new Date("2026-12-03T19:00:00Z"),
    sessionDay: "Tuesday", sessionTime: "1:00–3:00 PM", timezone: "America/Los_Angeles",
    price: 0, currency: "usd", capacity: 12, status: "RUNNING", isPrivate: true,
    trainerId: tri.id, companyId: meridian.id, createdAt: now, updatedAt: now,
  };

  const events: Row[] = [];
  for (let w = 1; w <= 24; w++) {
    const start = addDays(new Date(fall.startDate), (w - 1) * 7);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    const mod = moduleRows[(w - 1) % moduleRows.length];
    events.push({
      id: `ev_fall_${w}`, cohortId: fall.id, moduleId: mod?.id ?? null, type: "WEEKLY_SESSION",
      title: `Week ${w} · ${mod?.title ?? "Session"}`, startAt: start, endAt: end,
      joinUrl: "https://zoom.us/j/example", location: null, status: "scheduled", weekNo: w, createdAt: now,
    });
  }

  const users: Row[] = [tri, admin, rkim];
  const enrollments: Row[] = [];
  const moduleProgress: Row[] = [];
  const shipments: Row[] = [];
  const payments: Row[] = [];
  const bookings: Row[] = [];

  const people = [
    { key: "jordan", email: "jordan@acme.test", name: "Jordan Avery", company: acme, weeks: 7 },
    { key: "maya", email: "maya@acme.test", name: "Maya Rao", company: acme, weeks: 8 },
    { key: "devin", email: "devin@northwind.test", name: "Devin Cole", company: northwind, weeks: 3 },
    { key: "sam", email: "sam@independent.test", name: "Sam Park", company: null as Row | null, weeks: 6 },
  ];

  for (const p of people) {
    const user: Row = { id: `u_${p.key}`, email: p.email, name: p.name, role: "PARTICIPANT", status: "active", companyId: p.company?.id ?? null, image: null, title: null, phone: null, createdAt: now, updatedAt: now };
    users.push(user);
    const enrollment: Row = {
      id: `enr_${p.key}`, userId: user.id, cohortId: fall.id, companyId: p.company?.id ?? null,
      seatId: null, status: "ACTIVE", shippingAddress: { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" },
      enrolledAt: new Date("2026-06-20"), completedAt: null, createdAt: now, updatedAt: now,
    };
    enrollments.push(enrollment);
    for (let w = 1; w <= 24; w++) {
      moduleProgress.push({
        id: `mp_${p.key}_${w}`, enrollmentId: enrollment.id, weekNo: w,
        moduleId: moduleRows[(w - 1) % moduleRows.length]?.id ?? null,
        status: w < p.weeks ? "COMPLETED" : w === p.weeks ? "AVAILABLE" : "LOCKED",
        completedAt: w < p.weeks ? now : null,
      });
    }
    shipments.push({ id: `ship_${p.key}`, enrollmentId: enrollment.id, status: "PRINTING", carrier: null, tracking: null, address: { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" }, shippedAt: null, deliveredAt: null, createdAt: now, updatedAt: now });
    payments.push({ id: `pay_${p.key}`, enrollmentId: enrollment.id, companyId: p.company?.id ?? null, processor: "STRIPE", externalId: `seed_${user.id}`, amount: 550000, currency: "usd", status: "PAID", couponId: null, raw: null, createdAt: now, updatedAt: now });
    bookings.push({ id: `bk_${p.key}_1`, enrollmentId: enrollment.id, trainerId: tri.id, eventId: null, slot: new Date("2026-11-12T22:00:00Z"), status: "SCHEDULED", notes: null, sequence: 1, createdAt: now });
  }

  const viewer: Row = { id: "u_viewer", email: "viewer@acme.test", name: "Acme Manager", role: "COMPANY_VIEWER", status: "active", companyId: acme.id, image: null, title: null, phone: null, createdAt: now, updatedAt: now };
  users.push(viewer);

  // Threads: cohort channel + a 1:1 (Jordan ↔ Tri)
  const threads: Row[] = [];
  const threadMembers: Row[] = [];
  const messages: Row[] = [];

  const channel: Row = { id: "thr_channel", type: "COHORT_CHANNEL", cohortId: fall.id, title: "Fall 2026 Cohort", createdAt: now, updatedAt: now };
  threads.push(channel);
  for (const e of enrollments) {
    threadMembers.push({ id: `tm_${channel.id}_${e.userId}`, threadId: channel.id, userId: e.userId, lastReadAt: null });
  }
  threadMembers.push({ id: `tm_${channel.id}_${tri.id}`, threadId: channel.id, userId: tri.id, lastReadAt: null });
  messages.push({ id: "msg_channel_1", threadId: channel.id, senderId: tri.id, body: "Welcome to the Fall 2026 cohort! Drop a hello and one thing you want to work on.", attachments: null, createdAt: now });

  const direct: Row = { id: "thr_direct", type: "DIRECT", cohortId: null, title: "Jordan ↔ Tri", createdAt: now, updatedAt: now };
  threads.push(direct);
  threadMembers.push({ id: "tm_direct_jordan", threadId: direct.id, userId: "u_jordan", lastReadAt: null });
  threadMembers.push({ id: "tm_direct_tri", threadId: direct.id, userId: tri.id, lastReadAt: null });
  messages.push({ id: "msg_direct_1", threadId: direct.id, senderId: tri.id, body: "Hi Jordan — looking forward to our first 1:1.", attachments: null, createdAt: now });

  const emailTemplate: Row[] = [
    { id: "tpl_welcome", name: "Welcome", subject: "Welcome to TLC — {{cohortName}}", html: "<p>Welcome {{firstName}}! Your TLC journey begins soon.</p>", variables: null, scope: "SYSTEM", createdAt: now, updatedAt: now },
    { id: "tpl_weekly", name: "Weekly reminder", subject: "This week in TLC: {{moduleTitle}}", html: "<p>Hi {{firstName}}, your session is {{sessionTime}}.</p>", variables: null, scope: "TRAINER", createdAt: now, updatedAt: now },
  ];

  return {
    user: users,
    company: [acme, northwind, meridian],
    membership: [],
    program: [program],
    cohort: [fall, spring, meridianCohort],
    module: moduleRows,
    event: events,
    resource: [],
    assessment: [assessment],
    question,
    assessmentResponse: [],
    answerItem: [],
    seat: [],
    enrollment: enrollments,
    payment: payments,
    coupon: [],
    refund: [],
    shipment: shipments,
    moduleProgress,
    coachingBooking: bookings,
    certificate: [],
    thread: threads,
    threadMember: threadMembers,
    message: messages,
    emailTemplate,
    emailCampaign: [],
    notification: [],
    waitlistEntry: [],
    consentRecord: [],
    auditLog: [],
    account: [],
    session: [],
    verificationToken: [],
  };
}

export const store: Store = build();
