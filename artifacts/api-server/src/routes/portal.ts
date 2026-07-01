import { Router, type IRouter } from "express";
import { db, schema, eq, and, or, inArray, asc, desc } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requirePrincipal } from "../lib/principal";

const router: IRouter = Router();

const userCols = { id: true, name: true, email: true, image: true, title: true } as const;

/** The participant's primary (most-recent active/completed) enrollment tree. */
export async function loadParticipantContext(userId: string) {
  const enr = await db.query.enrollment.findFirst({
    where: and(
      eq(schema.enrollment.userId, userId),
      inArray(schema.enrollment.status, ["ACTIVE", "COMPLETED"]),
    ),
    orderBy: [desc(schema.enrollment.createdAt)],
    with: {
      user: { columns: userCols },
      cohort: {
        with: {
          program: {
            columns: { id: true, name: true, slug: true },
            with: { modules: { orderBy: [asc(schema.module.order)] } },
          },
          trainer: { columns: userCols },
          events: { orderBy: [asc(schema.event.startAt)] },
        },
      },
      shipment: true,
      moduleProgress: { orderBy: [asc(schema.moduleProgress.weekNo)], with: { module: true } },
      bookings: { orderBy: [asc(schema.coachingBooking.slot)], with: { trainer: { columns: userCols } } },
      certificate: true,
    },
  });
  return enr ?? null;
}

router.get(
  "/portal/context",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    res.json(enr);
  }),
);

/** Published materials: cohort-specific OR program-wide, for the participant. */
router.get(
  "/portal/materials",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json([]);
      return;
    }
    const resources = await db.query.resource.findMany({
      where: and(
        eq(schema.resource.status, "PUBLISHED"),
        or(
          eq(schema.resource.cohortId, enr.cohortId),
          eq(schema.resource.programId, enr.cohort.programId),
        ),
      ),
      orderBy: [asc(schema.resource.moduleId), asc(schema.resource.createdAt)],
      with: { module: true },
    });
    res.json(resources);
  }),
);

/** Resource library: all program modules + published program resources. */
router.get(
  "/portal/library",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json({ modules: [], resources: [] });
      return;
    }
    const modules = await db.query.module.findMany({
      where: eq(schema.module.programId, enr.cohort.programId),
      orderBy: [asc(schema.module.order)],
    });
    const resources = await db.query.resource.findMany({
      where: and(
        eq(schema.resource.status, "PUBLISHED"),
        eq(schema.resource.programId, enr.cohort.programId),
      ),
      with: { module: true },
    });
    res.json({ modules, resources });
  }),
);

export default router;
