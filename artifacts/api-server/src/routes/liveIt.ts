import { Router, type IRouter } from "express";
import { CheckLiveItItemBody } from "@workspace/api-zod";
import { db, schema, eq, and } from "../lib/db";
import { asyncHandler, badRequest, notFound, HttpError } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit } from "../lib/services";
import { isPortalClosed } from "../lib/portalState";
import { loadParticipantContext } from "./portal";

const router: IRouter = Router();

/**
 * The Live It checklist is lived, not completed: checking an item records the
 * one-line noticing ("what did you notice"), unchecking is an allowed
 * correction, and nothing ever reads as overdue. Notes are the participant's
 * private writing — the partner signal only ever says THAT something was
 * lived, never what was written.
 */

async function loadItemForParticipant(userId: string, itemId: string) {
  const enr = await loadParticipantContext(userId);
  if (!enr) throw badRequest("No active enrollment");
  if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");
  const item = await db.query.liveItItem.findFirst({ where: eq(schema.liveItItem.id, itemId) });
  if (!item || !enr.cohort.program.modules.some((m) => m.id === item.moduleId))
    throw notFound("Practice not found");
  return { enr, item };
}

router.post(
  "/portal/live-it/:itemId/check",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { note } = CheckLiveItItemBody.parse(req.body ?? {});
    const { enr, item } = await loadItemForParticipant(p.id, String(req.params.itemId));

    const existing = await db.query.liveItProgress.findFirst({
      where: and(
        eq(schema.liveItProgress.enrollmentId, enr.id),
        eq(schema.liveItProgress.itemId, item.id),
      ),
    });
    const values = { checkedAt: new Date(), note: note?.trim() || null };
    if (existing) {
      await db
        .update(schema.liveItProgress)
        .set({ ...values, note: values.note ?? existing.note })
        .where(eq(schema.liveItProgress.id, existing.id));
    } else {
      await db.insert(schema.liveItProgress).values({ enrollmentId: enr.id, itemId: item.id, ...values });
    }
    await audit({
      actorId: p.id,
      action: "liveit.check",
      entity: "LiveItItem",
      entityId: item.id,
      // Presence only — the noticing itself stays private.
      meta: { moduleId: item.moduleId },
    });
    res.json({ ok: true });
  }),
);

router.post(
  "/portal/live-it/:itemId/uncheck",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { enr, item } = await loadItemForParticipant(p.id, String(req.params.itemId));
    await db
      .update(schema.liveItProgress)
      .set({ checkedAt: null })
      .where(
        and(eq(schema.liveItProgress.enrollmentId, enr.id), eq(schema.liveItProgress.itemId, item.id)),
      );
    res.json({ ok: true });
  }),
);

export default router;
