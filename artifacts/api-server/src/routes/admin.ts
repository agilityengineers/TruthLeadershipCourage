import { Router, type IRouter } from "express";
import {
  CreateCompanyBody,
  PurchaseSeatsBody,
  CloneCohortBody,
  CreateCohortBody,
  UpdateCohortBody,
} from "@workspace/api-zod";
import { db, schema, eq, and, inArray, isNotNull, asc, desc, count } from "../lib/db";
import { asyncHandler, HttpError } from "../lib/http";
import { requireRole, requireCapability } from "../lib/principal";
import { audit } from "../lib/services";

const router: IRouter = Router();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

async function countBy(table: any, col: any) {
  const rows = await db.select({ key: col, n: count() }).from(table).groupBy(col);
  return new Map(rows.map((r: any) => [r.key, Number(r.n)]));
}

router.get(
  "/admin/overview",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const [ac, cc, ec, tc] = await Promise.all([
      db.select({ n: count() }).from(schema.cohort).where(eq(schema.cohort.status, "RUNNING")),
      db.select({ n: count() }).from(schema.company).where(eq(schema.company.status, "ACTIVE")),
      db.select({ n: count() }).from(schema.enrollment).where(inArray(schema.enrollment.status, ["ACTIVE", "COMPLETED"])),
      db.select({ n: count() }).from(schema.user).where(eq(schema.user.role, "TRAINER")),
    ]);
    const enrByCohort = await countBy(schema.enrollment, schema.enrollment.cohortId);

    const companies = await db.query.company.findMany({
      orderBy: [asc(schema.company.createdAt)],
      limit: 5,
      with: {
        seats: { columns: { id: true, status: true } },
        enrollments: { with: { cohort: { columns: { name: true } } } },
        users: { columns: { id: true, role: true } },
      },
    });
    const runningCohorts = await db.query.cohort.findMany({
      where: inArray(schema.cohort.status, ["RUNNING", "ENROLLING"]),
      orderBy: [asc(schema.cohort.startDate)],
    });
    const trainers = await db.query.user.findMany({
      where: eq(schema.user.role, "TRAINER"),
      with: { trainerCohorts: { columns: { id: true, name: true } } },
    });

    res.json({
      kpis: {
        activeCohorts: Number(ac[0]?.n ?? 0),
        companyCount: Number(cc[0]?.n ?? 0),
        enrolledCount: Number(ec[0]?.n ?? 0),
        trainerCount: Number(tc[0]?.n ?? 0),
      },
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        cohortName: c.enrollments[0]?.cohort?.name ?? null,
        seatsAssigned: c.seats.filter((s) => s.status !== "AVAILABLE").length,
        seatsTotal: c.seats.length || c.enrollments.length,
        viewers: c.users.filter((u) => u.role === "COMPANY_VIEWER").length,
      })),
      runningCohorts: runningCohorts.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        isPrivate: c.isPrivate,
        capacity: c.capacity,
        enrollmentCount: enrByCohort.get(c.id) ?? 0,
      })),
      trainers: trainers.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        cohorts: t.trainerCohorts.map((c) => ({
          id: c.id,
          name: c.name,
          enrollmentCount: enrByCohort.get(c.id) ?? 0,
        })),
      })),
    });
  }),
);

router.get(
  "/admin/companies",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const companies = await db.query.company.findMany({
      orderBy: [asc(schema.company.name)],
      with: {
        seats: { columns: { id: true, status: true } },
        enrollments: { with: { cohort: { columns: { name: true } } } },
        users: { columns: { id: true, role: true } },
      },
    });
    const cohorts = await db.query.cohort.findMany({
      where: inArray(schema.cohort.status, ["ENROLLING", "RUNNING"]),
      columns: { id: true, name: true },
    });
    res.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        cohortName: c.enrollments[0]?.cohort?.name ?? null,
        seatsAssigned: c.seats.filter((s) => s.status !== "AVAILABLE").length,
        seatsTotal: c.seats.length || c.enrollments.length,
        viewers: c.users.filter((u) => u.role === "COMPANY_VIEWER").length,
      })),
      cohorts,
    });
  }),
);

router.post(
  "/admin/companies",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "company:manage");
    const { name, billingEmail } = CreateCompanyBody.parse(req.body);
    let slug = slugify(name);
    if (await db.query.company.findFirst({ where: eq(schema.company.slug, slug) })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    const [company] = await db
      .insert(schema.company)
      .values({ name, slug, billingEmail: billingEmail || null })
      .returning();
    await audit({ actorId: principal.id, action: "company.create", entity: "Company", entityId: company!.id });
    res.json({ ok: true, id: company!.id });
  }),
);

router.post(
  "/admin/seats",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "company:manage");
    const { companyId, cohortId, quantity } = PurchaseSeatsBody.parse(req.body);
    if (quantity < 1 || quantity > 500) throw new HttpError(400, "Quantity must be between 1 and 500");
    await db.insert(schema.seat).values(
      Array.from({ length: quantity }, () => ({
        cohortId,
        companyId,
        status: "AVAILABLE" as const,
        purchasedById: principal.id,
      })),
    );
    await audit({ actorId: principal.id, action: "seats.purchase", entity: "Company", entityId: companyId, meta: { cohortId, quantity } });
    res.json({ ok: true });
  }),
);

router.get(
  "/admin/cohorts",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const cohorts = await db.query.cohort.findMany({
      orderBy: [desc(schema.cohort.startDate)],
      with: { trainer: { columns: { id: true, name: true } } },
    });
    const enrByCohort = await countBy(schema.enrollment, schema.enrollment.cohortId);
    res.json(
      cohorts.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        session1StartDate: c.session1StartDate,
        session1EndDate: c.session1EndDate,
        intersessionStartDate: c.intersessionStartDate,
        intersessionEndDate: c.intersessionEndDate,
        session2StartDate: c.session2StartDate,
        session2EndDate: c.session2EndDate,
        trainerName: c.trainer?.name ?? null,
        price: c.price,
        currency: c.currency,
        capacity: c.capacity,
        status: c.status,
        isPrivate: c.isPrivate,
        format: c.format,
        enrollmentCount: enrByCohort.get(c.id) ?? 0,
        programId: c.programId,
        trainerId: c.trainerId,
        companyId: c.companyId,
        sessionDay: c.sessionDay,
        sessionTime: c.sessionTime,
        timezone: c.timezone,
        tagline: c.tagline,
        description: c.description,
        heroImageUrl: c.heroImageUrl,
        location: c.location,
        enrollByDate: c.enrollByDate,
      })),
    );
  }),
);

/** Programs, trainers, and companies used to populate the create/edit cohort form. */
router.get(
  "/admin/cohorts/options",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const [programs, trainers, companies] = await Promise.all([
      db.query.program.findMany({ columns: { id: true, name: true }, orderBy: [asc(schema.program.name)] }),
      db.query.user.findMany({
        where: eq(schema.user.role, "TRAINER"),
        columns: { id: true, name: true },
        orderBy: [asc(schema.user.name)],
      }),
      db.query.company.findMany({ columns: { id: true, name: true }, orderBy: [asc(schema.company.name)] }),
    ]);
    res.json({ programs, trainers, companies });
  }),
);

async function uniqueCohortSlug(name: string) {
  let slug = slugify(name) || "cohort";
  if (await db.query.cohort.findFirst({ where: eq(schema.cohort.slug, slug) })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  return slug;
}

/**
 * Parse and order-check the three session ranges (Session 1 → Inter-session →
 * Session 2). Each field is optional; whatever is provided must be a valid
 * date, each range must end on/after it starts, and the phases must not run
 * backwards. Throws a 400 with a message the admin can act on.
 */
function parseSessionDates(body: {
  session1StartDate?: string | null;
  session1EndDate?: string | null;
  intersessionStartDate?: string | null;
  intersessionEndDate?: string | null;
  session2StartDate?: string | null;
  session2EndDate?: string | null;
}) {
  const parse = (value: string | null | undefined, label: string): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new HttpError(400, `${label} is not a valid date.`);
    return d;
  };
  const dates = {
    session1StartDate: parse(body.session1StartDate, "Session 1 start date"),
    session1EndDate: parse(body.session1EndDate, "Session 1 end date"),
    intersessionStartDate: parse(body.intersessionStartDate, "Inter-session start date"),
    intersessionEndDate: parse(body.intersessionEndDate, "Inter-session end date"),
    session2StartDate: parse(body.session2StartDate, "Session 2 start date"),
    session2EndDate: parse(body.session2EndDate, "Session 2 end date"),
  };
  const pairs: Array<[Date | null, Date | null, string]> = [
    [dates.session1StartDate, dates.session1EndDate, "Session 1"],
    [dates.intersessionStartDate, dates.intersessionEndDate, "Inter-session"],
    [dates.session2StartDate, dates.session2EndDate, "Session 2"],
  ];
  for (const [start, end, label] of pairs) {
    if (start && end && end < start) {
      throw new HttpError(400, `${label} must end on or after its start date.`);
    }
  }
  const sequence = [
    dates.session1StartDate,
    dates.session1EndDate,
    dates.intersessionStartDate,
    dates.intersessionEndDate,
    dates.session2StartDate,
    dates.session2EndDate,
  ].filter((d): d is Date => d !== null);
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i]! < sequence[i - 1]!) {
      throw new HttpError(400, "Session dates must run in order: Session 1, then Inter-session, then Session 2.");
    }
  }
  return dates;
}

/** Create a cohort from scratch — the way the very first cohort is born. */
router.post(
  "/admin/cohorts",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "cohort:manage");
    const body = CreateCohortBody.parse(req.body);

    let programId = body.programId;
    if (!programId) {
      const firstProgram = await db.query.program.findFirst({ orderBy: [asc(schema.program.createdAt)] });
      if (!firstProgram) throw new HttpError(400, "No program exists yet — seed a program before creating a cohort.");
      programId = firstProgram.id;
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new HttpError(400, "Invalid start or end date.");
    }
    if (endDate <= startDate) throw new HttpError(400, "End date must be after the start date.");
    const sessionDates = parseSessionDates(body);

    const slug = await uniqueCohortSlug(body.name);
    const [created] = await db
      .insert(schema.cohort)
      .values({
        programId,
        name: body.name,
        slug,
        startDate,
        endDate,
        ...sessionDates,
        sessionDay: body.sessionDay ?? null,
        sessionTime: body.sessionTime ?? null,
        timezone: body.timezone ?? null,
        price: body.price ?? 0,
        currency: body.currency ?? "usd",
        capacity: body.capacity ?? 0,
        status: (body.status ?? "DRAFT") as (typeof schema.cohort.$inferInsert)["status"],
        isPrivate: body.isPrivate ?? false,
        trainerId: body.trainerId || null,
        companyId: body.companyId || null,
        tagline: body.tagline ?? null,
        description: body.description ?? null,
        heroImageUrl: body.heroImageUrl ?? null,
        format: body.format ?? "online",
        location: body.location ?? null,
        enrollByDate: body.enrollByDate ? new Date(body.enrollByDate) : null,
      })
      .returning();

    await audit({ actorId: principal.id, action: "cohort.create", entity: "Cohort", entityId: created!.id });
    res.json({ ok: true, id: created!.id });
  }),
);

/** Edit a cohort's details and landing-page content. */
router.patch(
  "/admin/cohorts/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "cohort:manage");
    const id = String(req.params.id);
    const body = UpdateCohortBody.parse(req.body);
    const existing = await db.query.cohort.findFirst({ where: eq(schema.cohort.id, id) });
    if (!existing) throw new HttpError(404, "Cohort not found");

    const patch: Partial<typeof schema.cohort.$inferInsert> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.startDate !== undefined) patch.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) patch.endDate = new Date(body.endDate);
    const sessionKeys = [
      "session1StartDate",
      "session1EndDate",
      "intersessionStartDate",
      "intersessionEndDate",
      "session2StartDate",
      "session2EndDate",
    ] as const;
    if (sessionKeys.some((k) => body[k] !== undefined)) {
      // Validate the full picture: fields the request doesn't touch keep their
      // stored value, so ordering is checked against what will actually persist.
      const merged = Object.fromEntries(
        sessionKeys.map((k) => [k, body[k] !== undefined ? body[k] : existing[k]?.toISOString()]),
      );
      const sessionDates = parseSessionDates(merged);
      for (const k of sessionKeys) {
        if (body[k] !== undefined) patch[k] = sessionDates[k];
      }
    }
    if (body.sessionDay !== undefined) patch.sessionDay = body.sessionDay;
    if (body.sessionTime !== undefined) patch.sessionTime = body.sessionTime;
    if (body.timezone !== undefined) patch.timezone = body.timezone;
    if (body.price !== undefined) patch.price = body.price;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.capacity !== undefined) patch.capacity = body.capacity;
    if (body.status !== undefined) patch.status = body.status as (typeof schema.cohort.$inferInsert)["status"];
    if (body.isPrivate !== undefined) patch.isPrivate = body.isPrivate;
    if (body.trainerId !== undefined) patch.trainerId = body.trainerId || null;
    if (body.companyId !== undefined) patch.companyId = body.companyId || null;
    if (body.tagline !== undefined) patch.tagline = body.tagline;
    if (body.description !== undefined) patch.description = body.description;
    if (body.heroImageUrl !== undefined) patch.heroImageUrl = body.heroImageUrl;
    if (body.format !== undefined) patch.format = body.format;
    if (body.location !== undefined) patch.location = body.location;
    if (body.enrollByDate !== undefined) patch.enrollByDate = body.enrollByDate ? new Date(body.enrollByDate) : null;

    if (patch.startDate && patch.endDate && patch.endDate <= patch.startDate) {
      throw new HttpError(400, "End date must be after the start date.");
    }

    await db.update(schema.cohort).set(patch).where(eq(schema.cohort.id, id));
    await audit({ actorId: principal.id, action: "cohort.update", entity: "Cohort", entityId: id });
    res.json({ ok: true });
  }),
);

/**
 * Delete a cohort. A cohort with real participants (enrollments) can't be hard-
 * deleted — that would destroy payment and progress records — so we guide the
 * admin to archive it instead. Cohorts with no enrollments are removed along with
 * their scaffolding (events, seats, threads, resources, waitlist, campaigns).
 */
router.delete(
  "/admin/cohorts/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "cohort:manage");
    const id = String(req.params.id);
    const existing = await db.query.cohort.findFirst({ where: eq(schema.cohort.id, id) });
    if (!existing) throw new HttpError(404, "Cohort not found");

    const [{ n } = { n: 0 }] = await db
      .select({ n: count() })
      .from(schema.enrollment)
      .where(eq(schema.enrollment.cohortId, id));
    const enrolled = Number(n);
    if (enrolled > 0) {
      throw new HttpError(
        409,
        `This cohort has ${enrolled} enrollment${enrolled === 1 ? "" : "s"}. Archive it instead to preserve participant and payment records.`,
      );
    }

    await db.transaction(async (tx) => {
      const events = await tx.query.event.findMany({
        where: eq(schema.event.cohortId, id),
        columns: { id: true },
      });
      const eventIds = events.map((e) => e.id);
      if (eventIds.length) {
        await tx.delete(schema.coachingBooking).where(inArray(schema.coachingBooking.eventId, eventIds));
      }
      await tx.delete(schema.event).where(eq(schema.event.cohortId, id));

      const threads = await tx.query.thread.findMany({
        where: eq(schema.thread.cohortId, id),
        columns: { id: true },
      });
      const threadIds = threads.map((t) => t.id);
      if (threadIds.length) {
        await tx.delete(schema.message).where(inArray(schema.message.threadId, threadIds));
        await tx.delete(schema.threadMember).where(inArray(schema.threadMember.threadId, threadIds));
      }
      await tx.delete(schema.thread).where(eq(schema.thread.cohortId, id));

      await tx.delete(schema.seat).where(eq(schema.seat.cohortId, id));
      await tx.delete(schema.resource).where(eq(schema.resource.cohortId, id));
      await tx.delete(schema.waitlistEntry).where(eq(schema.waitlistEntry.cohortId, id));
      await tx.delete(schema.emailCampaign).where(eq(schema.emailCampaign.cohortId, id));
      await tx.delete(schema.cohort).where(eq(schema.cohort.id, id));
    });

    await audit({ actorId: principal.id, action: "cohort.delete", entity: "Cohort", entityId: id });
    res.json({ ok: true });
  }),
);

router.post(
  "/admin/cohorts/clone",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "cohort:manage");
    const { sourceId, name, startDate } = CloneCohortBody.parse(req.body);
    const source = await db.query.cohort.findFirst({
      where: eq(schema.cohort.id, sourceId),
      with: { events: true },
    });
    if (!source) throw new HttpError(404, "Source cohort not found");
    const newStart = new Date(startDate);
    if (Number.isNaN(newStart.getTime())) throw new HttpError(400, "Invalid start date.");
    const shiftMs = newStart.getTime() - new Date(source.startDate).getTime();
    const newEnd = new Date(new Date(source.endDate).getTime() + shiftMs);
    const shift = (d: Date | null) => (d ? new Date(d.getTime() + shiftMs) : null);
    let slug = slugify(name);
    if (await db.query.cohort.findFirst({ where: eq(schema.cohort.slug, slug) })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    const cloneId = await db.transaction(async (tx) => {
      const [clone] = await tx
        .insert(schema.cohort)
        .values({
          programId: source.programId,
          name,
          slug,
          startDate: newStart,
          endDate: newEnd,
          session1StartDate: shift(source.session1StartDate),
          session1EndDate: shift(source.session1EndDate),
          intersessionStartDate: shift(source.intersessionStartDate),
          intersessionEndDate: shift(source.intersessionEndDate),
          session2StartDate: shift(source.session2StartDate),
          session2EndDate: shift(source.session2EndDate),
          sessionDay: source.sessionDay,
          sessionTime: source.sessionTime,
          timezone: source.timezone,
          price: source.price,
          currency: source.currency,
          capacity: source.capacity,
          status: "ENROLLING",
          isPrivate: source.isPrivate,
          companyId: source.companyId,
          trainerId: source.trainerId,
        })
        .returning();
      if (source.events.length) {
        await tx.insert(schema.event).values(
          source.events.map((e) => ({
            cohortId: clone!.id,
            moduleId: e.moduleId,
            type: e.type,
            title: e.title,
            startAt: new Date(e.startAt.getTime() + shiftMs),
            endAt: new Date(e.endAt.getTime() + shiftMs),
            joinUrl: e.joinUrl,
            weekNo: e.weekNo,
          })),
        );
      }
      return clone!.id;
    });
    await audit({ actorId: principal.id, action: "cohort.clone", entity: "Cohort", entityId: cloneId, meta: { sourceId } });
    res.json({ ok: true, id: cloneId });
  }),
);

router.get(
  "/admin/participants",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const enrollments = await db.query.enrollment.findMany({
      orderBy: [desc(schema.enrollment.createdAt)],
      limit: 100,
      with: {
        user: { columns: { id: true, name: true, email: true } },
        company: { columns: { id: true, name: true } },
        cohort: { columns: { id: true, name: true } },
        moduleProgress: { columns: { status: true } },
      },
    });
    res.json(
      enrollments.map((e) => ({
        id: e.id,
        userName: e.user?.name ?? null,
        userEmail: e.user?.email ?? "",
        companyName: e.company?.name ?? null,
        cohortName: e.cohort?.name ?? "",
        completedCount: e.moduleProgress.filter((m) => m.status === "COMPLETED").length,
        totalCount: e.moduleProgress.length,
        status: e.status,
      })),
    );
  }),
);

router.get(
  "/admin/trainers",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const trainers = await db.query.user.findMany({
      where: eq(schema.user.role, "TRAINER"),
      orderBy: [asc(schema.user.name)],
      with: { trainerCohorts: { columns: { id: true, name: true } } },
    });
    const enrByCohort = await countBy(schema.enrollment, schema.enrollment.cohortId);
    res.json(
      trainers.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        cohorts: t.trainerCohorts.map((c) => ({ id: c.id, name: c.name, enrollmentCount: enrByCohort.get(c.id) ?? 0 })),
      })),
    );
  }),
);

router.get(
  "/admin/resources",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const resources = await db.query.resource.findMany({
      orderBy: [desc(schema.resource.createdAt)],
      limit: 40,
      with: { cohort: { columns: { name: true } } },
    });
    const now = new Date();
    const events = await db.query.event.findMany({
      orderBy: [asc(schema.event.startAt)],
      with: { cohort: { columns: { name: true } } },
    });
    res.json({
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        cohortName: r.cohort?.name ?? null,
      })),
      events: events
        .filter((e) => e.startAt >= now)
        .slice(0, 12)
        .map((e) => ({ id: e.id, title: e.title, startAt: e.startAt, cohortName: e.cohort?.name ?? "" })),
    });
  }),
);

router.get(
  "/admin/analytics",
  asyncHandler(async (req, res) => {
    await requireRole(req, "ADMIN");
    const cohorts = await db.query.cohort.findMany({
      where: inArray(schema.cohort.status, ["RUNNING", "COMPLETED", "ENROLLING"]),
      orderBy: [desc(schema.cohort.startDate)],
      with: { enrollments: { with: { moduleProgress: { columns: { status: true, completedAt: true } } } } },
    });
    const since = new Date(Date.now() - 14 * 864e5);
    const cohortStats = cohorts.map((c) => {
      const enrs = c.enrollments;
      const avgProgress =
        enrs.length === 0
          ? 0
          : Math.round(
              enrs.reduce((a, e) => a + pct(e.moduleProgress.filter((m) => m.status === "COMPLETED").length, 24), 0) /
                enrs.length,
            );
      const completed = enrs.filter((e) => e.status === "COMPLETED").length;
      const engaged = enrs.filter((e) => e.moduleProgress.some((m) => m.completedAt && m.completedAt > since)).length;
      return {
        id: c.id,
        name: c.name,
        enrolled: enrs.length,
        avgProgress,
        completionRate: pct(completed, enrs.length),
        engagement: pct(engaged, enrs.length),
      };
    });
    const companies = await db.query.company.findMany({
      with: { enrollments: { with: { moduleProgress: { columns: { status: true } } } } },
    });
    const companyStats = companies
      .map((co) => {
        const enrs = co.enrollments;
        const avg =
          enrs.length === 0
            ? 0
            : Math.round(
                enrs.reduce((a, e) => a + pct(e.moduleProgress.filter((m) => m.status === "COMPLETED").length, 24), 0) /
                  enrs.length,
              );
        return { id: co.id, name: co.name, participants: enrs.length, avg };
      })
      .filter((s) => s.participants > 0);
    res.json({ cohortStats, companyStats });
  }),
);

export default router;
export { isNotNull };
