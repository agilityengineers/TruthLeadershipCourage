import { Router, type IRouter } from "express";
import { CreateReflectionBody } from "@workspace/api-zod";
import { db, schema, eq, asc } from "../lib/db";
import { asyncHandler, badRequest, HttpError } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit } from "../lib/services";
import { isPortalClosed } from "../lib/portalState";
import { loadParticipantContext } from "./portal";

const router: IRouter = Router();

/**
 * Participant writing is self-scoped and append-only. Every save is a new row
 * — refining an I AM keeps every prior version quietly in the background.
 * These rows are never joined into trainer, company, or admin reads: that is
 * the "Only you see this" promise, enforced here rather than in the UI.
 */

router.get(
  "/portal/reflections",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json([]);
      return;
    }
    const rows = await db.query.reflection.findMany({
      where: eq(schema.reflection.enrollmentId, enr.id),
      orderBy: [asc(schema.reflection.createdAt)],
      with: { module: { columns: { title: true } } },
    });
    res.json(
      rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        promptKey: r.promptKey,
        moduleId: r.moduleId,
        moduleTitle: r.module?.title ?? null,
        body: r.body,
        createdAt: r.createdAt,
      })),
    );
  }),
);

router.post(
  "/portal/reflections",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { kind, promptKey, moduleId, body } = CreateReflectionBody.parse(req.body);
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");

    const text = body.trim();
    if (!text) throw badRequest("Write a line first");
    if (kind === "SEED" && !promptKey) throw badRequest("Seed reflections need a prompt");
    if (moduleId && !enr.cohort.program.modules.some((m) => m.id === moduleId))
      throw badRequest("Unknown module");

    const [row] = await db
      .insert(schema.reflection)
      .values({
        enrollmentId: enr.id,
        kind,
        promptKey: promptKey ?? null,
        moduleId: moduleId ?? null,
        body: text,
      })
      .returning();
    await audit({
      actorId: p.id,
      impersonatorId: p.impersonatorId,
      action: "reflection.write",
      entity: "Reflection",
      entityId: row!.id,
      // Only the kind — never the participant's words.
      meta: { kind },
    });
    const moduleTitle = moduleId
      ? (enr.cohort.program.modules.find((m) => m.id === moduleId)?.title ?? null)
      : null;
    res.json({
      id: row!.id,
      kind: row!.kind,
      promptKey: row!.promptKey,
      moduleId: row!.moduleId,
      moduleTitle,
      body: row!.body,
      createdAt: row!.createdAt,
    });
  }),
);

export default router;
