import { Router, type IRouter } from "express";
import { db, schema, eq, count } from "../lib/db";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

const TOTAL_WEEKS = 24;

function seatsLeft(capacity: number, enrolled: number): number | null {
  return capacity > 0 ? Math.max(0, capacity - enrolled) : null;
}

/**
 * Public: a single cohort's landing detail, addressed by slug. The list of
 * open cohorts is served separately by GET /cohorts/upcoming (enrollment route).
 */
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
      session1StartDate: cohort.session1StartDate,
      session1EndDate: cohort.session1EndDate,
      intersessionStartDate: cohort.intersessionStartDate,
      intersessionEndDate: cohort.intersessionEndDate,
      session2StartDate: cohort.session2StartDate,
      session2EndDate: cohort.session2EndDate,
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
