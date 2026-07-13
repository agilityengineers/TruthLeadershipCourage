import { Router, type IRouter } from "express";
import { CreateEventBody, CreateResourceBody, SetResourceStatusBody } from "@workspace/api-zod";
import { db, schema, eq, and, inArray, asc, desc, count } from "../lib/db";
import { asyncHandler, HttpError, notFound, forbidden } from "../lib/http";
import { requireRole, type Principal } from "../lib/principal";
import { cohortScope, enrollmentScope } from "../lib/scope";
import { audit, issueCertificate } from "../lib/services";

const router: IRouter = Router();
const userCols = { id: true, name: true, email: true, image: true, title: true } as const;
const TOTAL_WEEKS = 24;

function currentWeek(startDate: Date, totalWeeks = TOTAL_WEEKS): number {
  const start = new Date(startDate).getTime();
  const diff = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(Math.max(diff, 1), totalWeeks);
}

async function assertOwnsCohort(p: Principal, cohortId: string) {
  if (p.role === "ADMIN" || p.role === "SUPER_ADMIN") return;
  const cohort = await db.query.cohort.findFirst({
    where: eq(schema.cohort.id, cohortId),
    columns: { trainerId: true },
  });
  if (!cohort) throw notFound("Cohort not found");
  if (cohort.trainerId !== p.id) throw forbidden("Forbidden: not your cohort");
}

async function primaryCohort(p: Principal) {
  const scope = cohortScope(p);
  const running = await db.query.cohort.findFirst({
    where: scope ? and(scope, eq(schema.cohort.status, "RUNNING")) : eq(schema.cohort.status, "RUNNING"),
    orderBy: [asc(schema.cohort.startDate)],
  });
  if (running) return running;
  return db.query.cohort.findFirst({ where: scope, orderBy: [asc(schema.cohort.startDate)] });
}

router.get(
  "/trainer/overview",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const cohort = await primaryCohort(p);
    if (!cohort) {
      res.json({ cohort: null, week: null, activeCount: 0, participants: [], upcoming: [], resources: [] });
      return;
    }
    const week = currentWeek(cohort.startDate);
    const enrollments = await db.query.enrollment.findMany({
      where: eq(schema.enrollment.cohortId, cohort.id),
      orderBy: [asc(schema.enrollment.createdAt)],
      with: { user: { columns: userCols, with: { company: { columns: { id: true, name: true } } } }, moduleProgress: true },
    });
    const now = new Date();
    const upcoming = await db.query.event.findMany({
      where: eq(schema.event.cohortId, cohort.id),
      orderBy: [asc(schema.event.startAt)],
    });
    const resources = await db.query.resource.findMany({
      where: eq(schema.resource.cohortId, cohort.id),
      orderBy: [desc(schema.resource.createdAt)],
      limit: 4,
      with: { module: true },
    });
    res.json({
      cohort: {
        id: cohort.id,
        name: cohort.name,
        status: cohort.status,
        sessionDay: cohort.sessionDay,
        startDate: cohort.startDate,
        isPrivate: cohort.isPrivate,
        capacity: cohort.capacity,
      },
      week,
      activeCount: enrollments.filter((e) => e.status === "ACTIVE").length,
      participants: enrollments.map((e) => ({
        id: e.id,
        name: e.user?.name ?? e.user?.email ?? "",
        email: e.user?.email ?? "",
        company: e.user?.company?.name ?? "Independent",
        cohortName: cohort.name,
        completedCount: e.moduleProgress.filter((m) => m.status === "COMPLETED").length,
        totalCount: e.moduleProgress.length,
        status: e.status,
      })),
      upcoming: upcoming.filter((e) => e.startAt >= now).slice(0, 3),
      resources,
    });
  }),
);

router.get(
  "/trainer/participants",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const enrollments = await db.query.enrollment.findMany({
      where: enrollmentScope(p),
      with: {
        user: { columns: userCols, with: { company: { columns: { id: true, name: true } } } },
        cohort: { columns: { id: true, name: true, startDate: true } },
        moduleProgress: true,
      },
    });
    enrollments.sort(
      (a, b) =>
        new Date(a.cohort?.startDate ?? 0).getTime() - new Date(b.cohort?.startDate ?? 0).getTime(),
    );
    res.json(
      enrollments.map((e) => ({
        id: e.id,
        name: e.user?.name ?? e.user?.email ?? "",
        email: e.user?.email ?? "",
        company: e.user?.company?.name ?? "Independent",
        cohortName: e.cohort?.name ?? "",
        completedCount: e.moduleProgress.filter((m) => m.status === "COMPLETED").length,
        totalCount: e.moduleProgress.length,
        status: e.status,
      })),
    );
  }),
);

router.get(
  "/trainer/participants/:id",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const scope = enrollmentScope(p);
    const enr = await db.query.enrollment.findFirst({
      where: scope ? and(eq(schema.enrollment.id, String(req.params.id)), scope) : eq(schema.enrollment.id, String(req.params.id)),
      with: {
        user: { columns: userCols, with: { company: { columns: { id: true, name: true } } } },
        cohort: { columns: { id: true, name: true, status: true, startDate: true, isPrivate: true, capacity: true } },
        moduleProgress: { orderBy: [asc(schema.moduleProgress.weekNo)], with: { module: true } },
        certificate: true,
      },
    });
    if (!enr) {
      res.json(null);
      return;
    }
    res.json({
      id: enr.id,
      status: enr.status,
      user: { id: enr.user!.id, name: enr.user!.name, email: enr.user!.email, image: enr.user!.image, title: enr.user!.title },
      companyName: enr.user?.company?.name ?? null,
      cohort: enr.cohort,
      moduleProgress: enr.moduleProgress,
      certificate: enr.certificate ?? null,
    });
  }),
);

async function scopedCohorts(p: Principal) {
  const scope = cohortScope(p);
  const cohorts = await db.query.cohort.findMany({
    where: scope,
    orderBy: [asc(schema.cohort.startDate)],
    columns: { id: true, name: true },
  });
  return cohorts;
}

router.get(
  "/trainer/events",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const cohorts = await scopedCohorts(p);
    const ids = cohorts.map((c) => c.id);
    const events = ids.length
      ? await db.query.event.findMany({
          where: inArray(schema.event.cohortId, ids),
          orderBy: [asc(schema.event.startAt)],
          with: { cohort: { columns: { name: true } } },
        })
      : [];
    const modules = await db.query.module.findMany({
      orderBy: [asc(schema.module.order)],
      columns: { id: true, title: true, weekNo: true, pillar: true },
    });
    res.json({
      cohorts,
      events: events.map((e) => ({ ...e, cohortName: e.cohort?.name ?? "" })),
      modules,
    });
  }),
);

router.post(
  "/trainer/events",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const input = CreateEventBody.parse(req.body);
    const title = input.title.trim();
    if (!title) throw new HttpError(400, "Title is required");
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new HttpError(400, "Valid start and end times are required");
    }
    if (endAt < startAt) throw new HttpError(400, "End time must be after start time");
    await assertOwnsCohort(p, input.cohortId);
    const [event] = await db
      .insert(schema.event)
      .values({
        cohortId: input.cohortId,
        type: input.type as typeof schema.event.$inferInsert["type"],
        title,
        startAt,
        endAt,
        joinUrl: input.joinUrl?.trim() || null,
        location: input.location?.trim() || null,
        weekNo: input.weekNo ?? null,
        moduleId: input.moduleId || null,
      })
      .returning();
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "event.create", entity: "Event", entityId: event!.id, meta: { cohortId: input.cohortId } });
    res.json({ ok: true, id: event!.id });
  }),
);

router.get(
  "/trainer/resources",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const cohorts = await scopedCohorts(p);
    const ids = cohorts.map((c) => c.id);
    const resources = ids.length
      ? await db.query.resource.findMany({
          where: inArray(schema.resource.cohortId, ids),
          orderBy: [desc(schema.resource.createdAt)],
          with: { module: true, cohort: { columns: { name: true } } },
        })
      : [];
    const modules = await db.query.module.findMany({
      orderBy: [asc(schema.module.order)],
      columns: { id: true, title: true, pillar: true, weekNo: true },
    });
    res.json({
      cohorts,
      resources: resources.map((r) => ({ ...r, cohortName: r.cohort?.name ?? null })),
      modules,
    });
  }),
);

router.post(
  "/trainer/resources",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const input = CreateResourceBody.parse(req.body);
    const title = input.title.trim();
    if (!title) throw new HttpError(400, "Title is required");
    await assertOwnsCohort(p, input.cohortId);
    const [resource] = await db
      .insert(schema.resource)
      .values({
        cohortId: input.cohortId,
        title,
        type: input.type as typeof schema.resource.$inferInsert["type"],
        moduleId: input.moduleId || null,
        fileKey: input.fileKey?.trim() || null,
        description: input.description?.trim() || null,
        printReady: input.printReady ?? false,
        status: "DRAFT",
        uploadedById: p.id,
      })
      .returning();
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "resource.create", entity: "Resource", entityId: resource!.id, meta: { cohortId: input.cohortId } });
    res.json({ ok: true, id: resource!.id });
  }),
);

router.post(
  "/trainer/resources/:id/status",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const { status } = SetResourceStatusBody.parse(req.body);
    const resource = await db.query.resource.findFirst({
      where: eq(schema.resource.id, String(req.params.id)),
      columns: { id: true, cohortId: true },
    });
    if (!resource?.cohortId) throw notFound("Resource not found");
    await assertOwnsCohort(p, resource.cohortId);
    await db
      .update(schema.resource)
      .set({ status: status as typeof schema.resource.$inferInsert["status"] })
      .where(eq(schema.resource.id, String(req.params.id)));
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "resource.setStatus", entity: "Resource", entityId: String(req.params.id), meta: { status } });
    res.json({ ok: true });
  }),
);

router.post(
  "/trainer/enrollments/:id/certificate",
  asyncHandler(async (req, res) => {
    const p = await requireRole(req, "TRAINER", "ADMIN");
    const enr = await db.query.enrollment.findFirst({
      where: eq(schema.enrollment.id, String(req.params.id)),
      columns: { id: true, cohortId: true, status: true },
      with: { certificate: { columns: { id: true } } },
    });
    if (!enr) {
      res.json({ ok: false, error: "Enrollment not found" });
      return;
    }
    await assertOwnsCohort(p, enr.cohortId);
    if (enr.status !== "COMPLETED") {
      res.json({ ok: false, error: "Participant has not completed all weeks yet." });
      return;
    }
    const cert = await issueCertificate(enr.id);
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "certificate.issue", entity: "Certificate", entityId: cert!.id, meta: { enrollmentId: enr.id } });
    res.json({ ok: true, serial: cert!.serial });
  }),
);

export default router;
export { count };
