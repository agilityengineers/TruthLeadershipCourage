import { PrismaClient, Pillar, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PILLAR_COLOR: Record<string, string> = {
  EQ: "#024794",
  IQ: "#262161",
  MQ: "#662d91",
};

async function main() {
  console.log("Seeding TLC platform…");

  const pw = await bcrypt.hash("password123", 10);

  // ── Program + Assessment ──────────────────────────────────────────────
  const program = await db.program.upsert({
    where: { slug: "tlc" },
    update: {},
    create: {
      name: "TLC",
      slug: "tlc",
      description: "Truth · Leadership · Courage — the Wisdom Tri flagship leadership program.",
      assessment: {
        create: {
          title: "Leadership Assessment",
          questions: {
            create: [
              {
                order: 1,
                theme: "Self-leadership",
                pillar: Pillar.EQ,
                color: PILLAR_COLOR.EQ,
                prompt: "Under pressure, I lead from a grounded, steady place — not a reactive one.",
                benefit: "Lead from a steadier, grounded place and build deeper self-trust.",
              },
              {
                order: 2,
                theme: "Communication",
                pillar: Pillar.IQ,
                color: PILLAR_COLOR.IQ,
                prompt: "My team is clear on what's expected of them — and why it matters.",
                benefit: "Create clarity and clear expectations so execution holds.",
              },
              {
                order: 3,
                theme: "Conflict",
                pillar: Pillar.IQ,
                color: PILLAR_COLOR.IQ,
                prompt:
                  "When a hard conversation is needed, I prepare for it and hold it with confidence.",
                benefit: "Prepare for and hold hard conversations with ease.",
              },
              {
                order: 4,
                theme: "Accountability",
                pillar: Pillar.IQ,
                color: PILLAR_COLOR.IQ,
                prompt: "Commitments on my team are owned and followed through — without me chasing.",
                benefit: "Raise team accountability and engagement — without chasing.",
              },
              {
                order: 5,
                theme: "Developing others",
                pillar: Pillar.MQ,
                color: PILLAR_COLOR.MQ,
                prompt: "I actively mentor and grow the next generation of leaders around me.",
                benefit: "Mentor and grow future leaders; build an employee-centered culture.",
              },
            ],
          },
        },
      },
    },
    include: { assessment: true },
  });

  // ── Modules (24 weeks across pillars) ─────────────────────────────────
  const moduleSpecs: Array<{ pillar: Pillar; title: string }> = [
    { pillar: Pillar.EQ, title: "Self-Awareness" },
    { pillar: Pillar.EQ, title: "Self-Trust" },
    { pillar: Pillar.EQ, title: "Grounded Presence" },
    { pillar: Pillar.EQ, title: "Values & Vision" },
    { pillar: Pillar.IQ, title: "Clarity & Expectations" },
    { pillar: Pillar.IQ, title: "Hard Conversations" },
    { pillar: Pillar.IQ, title: "Accountability" },
    { pillar: Pillar.IQ, title: "Building Trust" },
    { pillar: Pillar.MQ, title: "Mentoring" },
    { pillar: Pillar.MQ, title: "Growing Future Leaders" },
  ];
  await db.module.deleteMany({ where: { programId: program.id } });
  for (let i = 0; i < moduleSpecs.length; i++) {
    await db.module.create({
      data: {
        programId: program.id,
        pillar: moduleSpecs[i].pillar,
        order: i + 1,
        weekNo: i + 1,
        title: moduleSpecs[i].title,
        summary: `Week ${i + 1} — ${moduleSpecs[i].title}.`,
      },
    });
  }

  // ── Trainers / Admin ──────────────────────────────────────────────────
  const tri = await db.user.upsert({
    where: { email: "tri@thewisdomtri.com" },
    update: {},
    create: {
      email: "tri@thewisdomtri.com",
      name: "Tri Nguyen",
      role: Role.TRAINER,
      passwordHash: pw,
      title: "Lead Trainer",
    },
  });
  await db.user.upsert({
    where: { email: "admin@thewisdomtri.com" },
    update: {},
    create: { email: "admin@thewisdomtri.com", name: "TLC Admin", role: Role.ADMIN, passwordHash: pw },
  });
  await db.user.upsert({
    where: { email: "rkim@thewisdomtri.com" },
    update: {},
    create: { email: "rkim@thewisdomtri.com", name: "R. Kim", role: Role.TRAINER, passwordHash: pw },
  });

  // ── Companies ─────────────────────────────────────────────────────────
  const acme = await db.company.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Corp", slug: "acme", billingEmail: "billing@acme.test" },
  });
  const northwind = await db.company.upsert({
    where: { slug: "northwind" },
    update: {},
    create: { name: "Northwind Group", slug: "northwind", billingEmail: "ap@northwind.test" },
  });
  const meridian = await db.company.upsert({
    where: { slug: "meridian" },
    update: {},
    create: { name: "Meridian Health", slug: "meridian", billingEmail: "finance@meridian.test" },
  });

  // ── Cohorts (concurrent — proving the series architecture) ────────────
  const fall = await db.cohort.upsert({
    where: { slug: "fall-2026" },
    update: {},
    create: {
      programId: program.id,
      name: "Fall 2026",
      slug: "fall-2026",
      startDate: new Date("2026-08-13T16:00:00Z"), // Thu 9am PST
      endDate: new Date("2027-02-25T19:00:00Z"),
      sessionDay: "Thursday",
      sessionTime: "9:00–11:00 AM",
      timezone: "America/Los_Angeles",
      price: 550000,
      capacity: 84,
      status: "RUNNING",
      trainerId: tri.id,
    },
  });
  await db.cohort.upsert({
    where: { slug: "spring-2027" },
    update: {},
    create: {
      programId: program.id,
      name: "Spring 2027",
      slug: "spring-2027",
      startDate: new Date("2027-03-04T17:00:00Z"),
      endDate: new Date("2027-09-02T19:00:00Z"),
      sessionDay: "Thursday",
      sessionTime: "9:00–11:00 AM",
      price: 550000,
      capacity: 62,
      status: "ENROLLING",
      trainerId: tri.id,
    },
  });
  await db.cohort.upsert({
    where: { slug: "meridian-private" },
    update: {},
    create: {
      programId: program.id,
      name: "Meridian — Private",
      slug: "meridian-private",
      startDate: new Date("2026-06-04T17:00:00Z"),
      endDate: new Date("2026-12-03T19:00:00Z"),
      sessionDay: "Tuesday",
      sessionTime: "1:00–3:00 PM",
      price: 0,
      capacity: 12,
      status: "RUNNING",
      isPrivate: true,
      companyId: meridian.id,
      trainerId: tri.id,
    },
  });

  // ── Weekly session Events for Fall 2026 (24 weeks) ────────────────────
  const modules = await db.module.findMany({
    where: { programId: program.id },
    orderBy: { order: "asc" },
  });
  await db.event.deleteMany({ where: { cohortId: fall.id } });
  for (let w = 1; w <= 24; w++) {
    const start = new Date(fall.startDate);
    start.setDate(start.getDate() + (w - 1) * 7);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    const mod = modules[(w - 1) % modules.length];
    await db.event.create({
      data: {
        cohortId: fall.id,
        moduleId: mod?.id,
        type: "WEEKLY_SESSION",
        title: `Week ${w} · ${mod?.title ?? "Session"}`,
        startAt: start,
        endAt: end,
        weekNo: w,
        joinUrl: "https://zoom.us/j/example",
      },
    });
  }

  // ── Participants + Enrollments (Acme/Northwind/independent) ────────────
  const people = [
    { email: "jordan@acme.test", name: "Jordan Avery", company: acme, weeks: 7 },
    { email: "maya@acme.test", name: "Maya Rao", company: acme, weeks: 8 },
    { email: "devin@northwind.test", name: "Devin Cole", company: northwind, weeks: 3 },
    { email: "sam@independent.test", name: "Sam Park", company: null, weeks: 6 },
  ];

  for (const person of people) {
    const user = await db.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        email: person.email,
        name: person.name,
        role: Role.PARTICIPANT,
        passwordHash: pw,
        companyId: person.company?.id ?? null,
      },
    });
    const enrollment = await db.enrollment.upsert({
      where: { userId_cohortId: { userId: user.id, cohortId: fall.id } },
      update: {},
      create: {
        userId: user.id,
        cohortId: fall.id,
        companyId: person.company?.id ?? null,
        status: "ACTIVE",
        enrolledAt: new Date("2026-06-20"),
        shippingAddress: { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" },
      },
    });
    // Module progress
    for (let w = 1; w <= 24; w++) {
      await db.moduleProgress.upsert({
        where: { enrollmentId_weekNo: { enrollmentId: enrollment.id, weekNo: w } },
        update: {},
        create: {
          enrollmentId: enrollment.id,
          weekNo: w,
          moduleId: modules[(w - 1) % modules.length]?.id,
          status: w < person.weeks ? "COMPLETED" : w === person.weeks ? "AVAILABLE" : "LOCKED",
          completedAt: w < person.weeks ? new Date() : null,
        },
      });
    }
    // Shipment
    await db.shipment.upsert({
      where: { enrollmentId: enrollment.id },
      update: {},
      create: {
        enrollmentId: enrollment.id,
        status: "PRINTING",
        address: { line1: "123 Main St", city: "Seattle", state: "WA", postal: "98101" },
      },
    });
    // Payment (paid)
    await db.payment.upsert({
      where: { enrollmentId: enrollment.id },
      update: {},
      create: {
        enrollmentId: enrollment.id,
        companyId: person.company?.id ?? null,
        processor: "STRIPE",
        amount: 550000,
        status: "PAID",
        externalId: `seed_${user.id}`,
      },
    });
    // Two coaching bookings
    await db.coachingBooking.deleteMany({ where: { enrollmentId: enrollment.id } });
    await db.coachingBooking.create({
      data: {
        enrollmentId: enrollment.id,
        trainerId: tri.id,
        slot: new Date("2026-11-12T22:00:00Z"),
        sequence: 1,
        status: "SCHEDULED",
      },
    });
  }

  // ── Company viewer (Tier 3, read-only) ────────────────────────────────
  await db.user.upsert({
    where: { email: "viewer@acme.test" },
    update: {},
    create: {
      email: "viewer@acme.test",
      name: "Acme Manager",
      role: Role.COMPANY_VIEWER,
      passwordHash: pw,
      companyId: acme.id,
    },
  });

  // ── Threads: cohort channel + a 1:1 ───────────────────────────────────
  const jordan = await db.user.findUnique({ where: { email: "jordan@acme.test" } });
  const existingChannel = await db.thread.findFirst({
    where: { cohortId: fall.id, type: "COHORT_CHANNEL" },
  });
  if (!existingChannel) {
    const channel = await db.thread.create({
      data: { type: "COHORT_CHANNEL", cohortId: fall.id, title: "Fall 2026 Cohort" },
    });
    const enrollees = await db.enrollment.findMany({ where: { cohortId: fall.id } });
    for (const e of enrollees) {
      await db.threadMember.create({ data: { threadId: channel.id, userId: e.userId } });
    }
    await db.threadMember.create({ data: { threadId: channel.id, userId: tri.id } });
    await db.message.create({
      data: {
        threadId: channel.id,
        senderId: tri.id,
        body: "Welcome to the Fall 2026 cohort! Drop a hello and one thing you want to work on.",
      },
    });
  }
  if (jordan) {
    const existingDirect = await db.thread.findFirst({
      where: {
        type: "DIRECT",
        members: { every: { userId: { in: [jordan.id, tri.id] } } },
      },
    });
    if (!existingDirect) {
      const direct = await db.thread.create({
        data: {
          type: "DIRECT",
          title: "Jordan ↔ Tri",
          members: { create: [{ userId: jordan.id }, { userId: tri.id }] },
        },
      });
      await db.message.create({
        data: { threadId: direct.id, senderId: tri.id, body: "Hi Jordan — looking forward to our first 1:1." },
      });
    }
  }

  // ── Email templates ───────────────────────────────────────────────────
  await db.emailTemplate.deleteMany({});
  await db.emailTemplate.createMany({
    data: [
      {
        name: "Welcome",
        subject: "Welcome to TLC — {{cohortName}}",
        html: "<p>Welcome {{firstName}}! Your TLC journey begins soon.</p>",
        scope: "SYSTEM",
      },
      {
        name: "Weekly reminder",
        subject: "This week in TLC: {{moduleTitle}}",
        html: "<p>Hi {{firstName}}, your session is {{sessionTime}}.</p>",
        scope: "TRAINER",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Logins (password: password123):");
  console.log("  admin@thewisdomtri.com  (ADMIN)");
  console.log("  tri@thewisdomtri.com    (TRAINER)");
  console.log("  jordan@acme.test        (PARTICIPANT)");
  console.log("  viewer@acme.test        (COMPANY_VIEWER)");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
