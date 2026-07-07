import { Router, type IRouter } from "express";
import { db, schema, eq, and, inArray, asc, count } from "../lib/db";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

const TOTAL_WEEKS = 24;

function seatsLeft(capacity: number, enrolled: number): number | null {
  return capacity > 0 ? Math.max(0, capacity - enrolled) : null;
}

/** Public: cohorts open for enrollment, for the marketing "Upcoming cohorts" index. */
router.get(
  "/cohorts",
  asyncHandler(async (_req, res) => {
    const cohorts = await db.query.cohort.findMany({
      where: and(
        eq(schema.cohort.isPrivate, false),
        inArray(schema.cohort.status, ["ENROLLING", "RUNNING"]),
      ),
      orderBy: [asc(schema.cohort.startDate)],
      with: { trainer: { columns: { name: true } } },
    });
    const counts = await db
      .select({ cohortId: schema.enrollment.cohortId, n: count() })
      .from(schema.enrollment)
      .groupBy(schema.enrollment.cohortId);
    const countMap = new Map(counts.map((c) => [c.cohortId, Number(c.n)]));

    res.json(
      cohorts.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        startDate: c.startDate,
        endDate: c.endDate,
        sessionDay: c.sessionDay,
        sessionTime: c.sessionTime,
        timezone: c.timezone,
        price: c.price,
        currency: c.currency,
        status: c.status,
        format: c.format,
        location: c.location,
        heroImageUrl: c.heroImageUrl,
        trainerName: c.trainer?.name ?? null,
        seatsLeft: seatsLeft(c.capacity, countMap.get(c.id) ?? 0),
      })),
    );
  }),
);

/** Public: a single cohort's landing detail, addressed by slug. */
router.get(
  "/cohorts/:slug",
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const cohort = await db.query.cohort.findFirst({
      where: eq(schema.cohort.slug, slug),
      with: {
        program: { columns: { name: true, description: true } },
        trainer: { columns: { name: true, title: true } },
      },
    });
    if (!cohort) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }
    const [{ n } = { n: 0 }] = await db
      .select({ n: count() })
      .from(schema.enrollment)
      .where(eq(schema.enrollment.cohortId, cohort.id));
    const enrolled = Number(n);

    res.json({
      id: cohort.id,
      slug: cohort.slug,
      name: cohort.name,
      tagline: cohort.tagline,
      description: cohort.description,
      heroImageUrl: cohort.heroImageUrl,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      enrollByDate: cohort.enrollByDate,
      sessionDay: cohort.sessionDay,
      sessionTime: cohort.sessionTime,
      timezone: cohort.timezone,
      price: cohort.price,
      currency: cohort.currency,
      status: cohort.status,
      format: cohort.format,
      location: cohort.location,
      isPrivate: cohort.isPrivate,
      capacity: cohort.capacity,
      enrollmentCount: enrolled,
      seatsLeft: seatsLeft(cohort.capacity, enrolled),
      totalWeeks: TOTAL_WEEKS,
      programName: cohort.program?.name ?? "The Wisdom Tri",
      programDescription: cohort.program?.description ?? null,
      trainerName: cohort.trainer?.name ?? null,
      trainerTitle: cohort.trainer?.title ?? null,
    });
  }),
);

export default router;
