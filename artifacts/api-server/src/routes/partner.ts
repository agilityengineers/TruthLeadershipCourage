import { Router, type IRouter } from "express";
import { ChoosePartnerBody, SendPartnerNoteBody } from "@workspace/api-zod";
import { db, schema, eq, and, or, ne } from "../lib/db";
import { asyncHandler, badRequest, HttpError } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit, notify } from "../lib/services";
import {
  buildPortalHome,
  findDirectThread,
  isPortalClosed,
  parsePreview,
} from "../lib/portalState";
import { loadParticipantContext } from "./portal";

const router: IRouter = Router();

/**
 * Accountability partners: warm, small, never a scoreboard. The API exposes
 * presence signals only — a name, whether they practiced this week, one tap
 * to send a note. What a partner wrote is never readable here or anywhere.
 */

async function activeLinkFor(cohortId: string, enrollmentId: string) {
  return db.query.partnerLink.findFirst({
    where: and(
      eq(schema.partnerLink.cohortId, cohortId),
      eq(schema.partnerLink.status, "ACTIVE"),
      or(
        eq(schema.partnerLink.enrollmentAId, enrollmentId),
        eq(schema.partnerLink.enrollmentBId, enrollmentId),
      ),
    ),
  });
}

router.get(
  "/portal/partner",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json(null);
      return;
    }
    // Reuse the home-state derivation so the row matches the home screen.
    const state = await buildPortalHome(enr, { preview: parsePreview(req.query.preview) });
    res.json(state.partner);
  }),
);

/** Unpartnered peers in the same cohort — names only. */
router.get(
  "/portal/partner/candidates",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json([]);
      return;
    }
    const peers = await db.query.enrollment.findMany({
      where: and(
        eq(schema.enrollment.cohortId, enr.cohortId),
        eq(schema.enrollment.status, "ACTIVE"),
        ne(schema.enrollment.id, enr.id),
      ),
      with: { user: { columns: { name: true } } },
    });
    const links = await db.query.partnerLink.findMany({
      where: and(eq(schema.partnerLink.cohortId, enr.cohortId), eq(schema.partnerLink.status, "ACTIVE")),
    });
    const taken = new Set(links.flatMap((l) => [l.enrollmentAId, l.enrollmentBId]));
    res.json(
      peers
        .filter((peer) => !taken.has(peer.id))
        .map((peer) => ({ enrollmentId: peer.id, name: peer.user?.name ?? "Participant" })),
    );
  }),
);

router.post(
  "/portal/partner",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { enrollmentId: otherId } = ChoosePartnerBody.parse(req.body);
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");
    if (otherId === enr.id) throw badRequest("Choose a cohort peer");

    const other = await db.query.enrollment.findFirst({
      where: and(eq(schema.enrollment.id, otherId), eq(schema.enrollment.cohortId, enr.cohortId)),
      with: { user: { columns: { id: true, name: true } } },
    });
    if (!other || other.status !== "ACTIVE") throw badRequest("That participant isn't in your cohort");
    if (await activeLinkFor(enr.cohortId, enr.id)) throw badRequest("You already have a partner");
    if (await activeLinkFor(enr.cohortId, otherId)) throw badRequest("They already have a partner");

    const [link] = await db
      .insert(schema.partnerLink)
      .values({ cohortId: enr.cohortId, enrollmentAId: enr.id, enrollmentBId: otherId, createdBy: p.id })
      .returning();
    await audit({ actorId: p.id, action: "partner.link", entity: "PartnerLink", entityId: link!.id });
    if (other.user) {
      await notify({
        userId: other.user.id,
        type: "GENERIC",
        title: `${enr.user.name ?? "A cohort peer"} chose you as their accountability partner`,
        body: "You'll see each other's practice presence on your home screens.",
        href: "/portal",
      });
    }
    res.json({ ok: true });
  }),
);

/** One-tap note to the partner, carried by the existing direct-message rails. */
router.post(
  "/portal/partner/note",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { body } = SendPartnerNoteBody.parse(req.body);
    const text = body.trim();
    if (!text) throw badRequest("Write a note first");
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");

    const link = await activeLinkFor(enr.cohortId, enr.id);
    if (!link) throw badRequest("Choose a partner first");
    const otherEnrId = link.enrollmentAId === enr.id ? link.enrollmentBId : link.enrollmentAId;
    const other = await db.query.enrollment.findFirst({
      where: eq(schema.enrollment.id, otherEnrId),
      with: { user: { columns: { id: true, name: true } } },
    });
    if (!other?.user) throw badRequest("Partner not found");

    let threadId = await findDirectThread(enr.userId, other.user.id);
    if (!threadId) {
      const [t] = await db
        .insert(schema.thread)
        .values({ type: "DIRECT", title: null })
        .returning();
      threadId = t!.id;
      await db.insert(schema.threadMember).values([
        { threadId, userId: enr.userId },
        { threadId, userId: other.user.id },
      ]);
    }
    await db.insert(schema.message).values({ threadId, senderId: p.id, body: text });
    await notify({
      userId: other.user.id,
      type: "NEW_MESSAGE",
      title: `A note from ${enr.user.name ?? "your partner"}`,
      href: "/portal/messages",
    });
    res.json({ ok: true, threadId });
  }),
);

export default router;
