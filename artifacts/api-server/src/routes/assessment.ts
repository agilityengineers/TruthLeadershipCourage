import { Router, type IRouter } from "express";
import { SubmitAssessmentBody, AddQuestionBody, UpdateQuestionBody } from "@workspace/api-zod";
import { db, schema, eq, and, asc, isNotNull, count, sql } from "../lib/db";
import { asyncHandler, HttpError, notFound } from "../lib/http";
import { requireCapability } from "../lib/principal";
import { audit, computeSnapshot, PILLAR_COLOR, type QuestionLite } from "../lib/services";
import { rateLimit, clientIp } from "../lib/ratelimit";

const router: IRouter = Router();

async function tlcAssessment() {
  const program = await db.query.program.findFirst({ where: eq(schema.program.slug, "tlc") });
  if (!program) return null;
  return db.query.assessment.findFirst({ where: eq(schema.assessment.programId, program.id) });
}

/** Public: assessment with its active questions (signup flow). */
router.get(
  "/assessment",
  asyncHandler(async (_req, res) => {
    const assessment = await tlcAssessment();
    if (!assessment) {
      res.json({ id: "", title: "", questions: [] });
      return;
    }
    const questions = await db.query.question.findMany({
      where: and(eq(schema.question.assessmentId, assessment.id), eq(schema.question.active, true)),
      orderBy: [asc(schema.question.order)],
    });
    res.json({
      id: assessment.id,
      title: assessment.title,
      questions: questions.map((q) => ({
        id: q.id,
        theme: q.theme,
        pillar: q.pillar,
        color: q.color,
        prompt: q.prompt,
        benefit: q.benefit,
      })),
    });
  }),
);

/** Public: persist a completed assessment + computed snapshot. */
router.post(
  "/assessment/submit",
  asyncHandler(async (req, res) => {
    if (!rateLimit(`assessment:${clientIp(req)}`, { limit: 20, windowMs: 60 * 60_000 }).ok) {
      throw new HttpError(429, "Too many submissions from this network. Please try again shortly.");
    }
    const { answers, leadEmail, leadName } = SubmitAssessmentBody.parse(req.body);
    const assessment = await tlcAssessment();
    if (!assessment) throw new HttpError(500, "Assessment not configured");
    const questions = await db.query.question.findMany({
      where: and(eq(schema.question.assessmentId, assessment.id), eq(schema.question.active, true)),
      orderBy: [asc(schema.question.order)],
    });
    const lite: QuestionLite[] = questions.map((q) => ({
      id: q.id,
      theme: q.theme,
      pillar: q.pillar,
      color: q.color ?? "",
      prompt: q.prompt,
      benefit: q.benefit,
    }));
    const snapshot = computeSnapshot(lite, answers as Record<string, number>);

    const [response] = await db
      .insert(schema.assessmentResponse)
      .values({
        assessmentId: assessment.id,
        leadEmail: leadEmail || null,
        leadName: leadName || null,
        completedAt: new Date(),
        snapshot,
      })
      .returning();

    const items = Object.entries(answers as Record<string, number>)
      .filter(([qid]) => lite.some((q) => q.id === qid))
      .map(([questionId, value]) => ({ responseId: response!.id, questionId, value }));
    if (items.length) await db.insert(schema.answerItem).values(items);

    res.json({ responseId: response!.id, snapshot });
  }),
);

/** Admin: full assessment (all questions) + completed-response count. */
router.get(
  "/admin/assessment",
  asyncHandler(async (req, res) => {
    await requireCapability(req, "assessment:manage");
    const assessment = await tlcAssessment();
    if (!assessment) {
      res.json({ assessmentId: null, responses: 0, questions: [] });
      return;
    }
    const questions = await db.query.question.findMany({
      where: eq(schema.question.assessmentId, assessment.id),
      orderBy: [asc(schema.question.order)],
    });
    const [{ value: responses } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.assessmentResponse)
      .where(
        and(
          eq(schema.assessmentResponse.assessmentId, assessment.id),
          isNotNull(schema.assessmentResponse.completedAt),
        ),
      );
    res.json({
      assessmentId: assessment.id,
      responses: Number(responses),
      questions: questions.map((q) => ({
        id: q.id,
        theme: q.theme,
        pillar: q.pillar,
        color: q.color,
        prompt: q.prompt,
        benefit: q.benefit,
        order: q.order,
        active: q.active,
      })),
    });
  }),
);

router.post(
  "/admin/assessment/questions",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "assessment:manage");
    const body = AddQuestionBody.parse(req.body);
    const assessment = await tlcAssessment();
    if (!assessment) throw new HttpError(500, "Assessment not configured");
    const [{ max } = { max: 0 }] = await db
      .select({ max: sql<number>`coalesce(max(${schema.question.order}), 0)` })
      .from(schema.question)
      .where(eq(schema.question.assessmentId, assessment.id));
    const [q] = await db
      .insert(schema.question)
      .values({
        assessmentId: assessment.id,
        order: Number(max) + 1,
        theme: body.theme,
        pillar: body.pillar,
        color: PILLAR_COLOR[body.pillar],
        prompt: body.prompt,
        benefit: body.benefit,
      })
      .returning();
    await audit({ actorId: principal.id, action: "question.add", entity: "Question", entityId: q!.id });
    res.json({ ok: true });
  }),
);

router.post(
  "/admin/assessment/questions/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "assessment:manage");
    const body = UpdateQuestionBody.parse(req.body);
    const id = String(req.params.id);
    const existing = await db.query.question.findFirst({ where: eq(schema.question.id, id) });
    if (!existing) throw notFound("Question not found");
    await db
      .update(schema.question)
      .set({
        theme: body.theme,
        pillar: body.pillar,
        color: PILLAR_COLOR[body.pillar],
        prompt: body.prompt,
        benefit: body.benefit,
        ...(body.active === undefined ? {} : { active: body.active }),
      })
      .where(eq(schema.question.id, id));
    await audit({ actorId: principal.id, action: "question.update", entity: "Question", entityId: id });
    res.json({ ok: true });
  }),
);

router.delete(
  "/admin/assessment/questions/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "assessment:manage");
    const id = String(req.params.id);
    await db.delete(schema.answerItem).where(eq(schema.answerItem.questionId, id));
    await db.delete(schema.question).where(eq(schema.question.id, id));
    await audit({ actorId: principal.id, action: "question.delete", entity: "Question", entityId: id });
    res.json({ ok: true });
  }),
);

export default router;
