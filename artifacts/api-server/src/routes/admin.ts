import { Router, type IRouter } from "express";
import { CreateCompanyBody, PurchaseSeatsBody, CloneCohortBody } from "@workspace/api-zod";
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
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        trainerName: c.trainer?.name ?? null,
        price: c.price,
        currency: c.currency,
        capacity: c.capacity,
        status: c.status,
        isPrivate: c.isPrivate,
        enrollmentCount: enrByCohort.get(c.id) ?? 0,
      })),
    );
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
    const shiftMs = newStart.getTime() - new Date(source.startDate).getTime();
    const newEnd = new Date(new Date(source.endDate).getTime() + shiftMs);
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
