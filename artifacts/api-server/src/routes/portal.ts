import { Router, type IRouter } from "express";
import { db, schema, eq, and, or, inArray, asc, desc } from "../lib/db";
import { asyncHandler, badRequest, HttpError } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit, notify } from "../lib/services";
import { buildPortalHome, isPortalClosed, parsePreview } from "../lib/portalState";

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

/**
 * The home screen state: one payload carrying the anchor, Now card, journey
 * line, mirror, Live It checklist, and partner presence — all derived from
 * the program schedule. `?preview=` shifts the derived clock for demos, the
 * way the old `?phase=` toggle did.
 */
router.get(
  "/portal/home",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json(null);
      return;
    }
    const state = await buildPortalHome(enr, { preview: parsePreview(req.query.preview) });
    res.json(state);
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

/**
 * Request a printed workbook. Mailing has a lead-time cutoff before day one;
 * closer than that the request still goes through with a heads-up that the
 * digital copy carries the start (the design's "fallback for anyone who
 * enrolls close to the start date").
 */
const PRINT_LEAD_DAYS = 14;
router.post(
  "/portal/shipment/request",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");
    if (!enr.shipment) {
      await db.insert(schema.shipment).values({
        enrollmentId: enr.id,
        status: "NOT_REQUESTED",
        address: enr.shippingAddress ?? null,
      });
    }
    const shipment = await db.query.shipment.findFirst({
      where: eq(schema.shipment.enrollmentId, enr.id),
    });
    if (!shipment) throw badRequest("Shipment record unavailable");
    if (shipment.status !== "NOT_REQUESTED") {
      res.json({ ok: false, status: shipment.status, message: "A printed copy is already on its way." });
      return;
    }
    await db
      .update(schema.shipment)
      .set({ status: "PENDING", requestedAt: new Date(), address: shipment.address ?? enr.shippingAddress ?? null })
      .where(eq(schema.shipment.id, shipment.id));
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "shipment.requested", entity: "Shipment", entityId: shipment.id });
    await notify({
      userId: enr.userId,
      type: "SHIPMENT_UPDATE",
      title: "Printed workbook requested",
      body: "We'll let you know when it ships.",
      href: "/portal/workbook",
    });
    const cutoff = new Date(new Date(enr.cohort.startDate).getTime() - PRINT_LEAD_DAYS * 24 * 60 * 60 * 1000);
    const late = new Date() > cutoff && new Date() < new Date(enr.cohort.startDate);
    res.json({
      ok: true,
      status: "PENDING",
      message: late
        ? "Requested — printing takes about two weeks, so it may arrive after day one. Your digital workbook carries the start."
        : "Requested — we'll mail it to the address from your enrollment.",
    });
  }),
);

/**
 * Everything the participant wrote, bundled to take with them. Offered at
 * graduation and again before the portal closes — and available the whole
 * time in Account settings. Reachable even after the close.
 */
router.get(
  "/portal/export",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    const reflections = await db.query.reflection.findMany({
      where: eq(schema.reflection.enrollmentId, enr.id),
      orderBy: [asc(schema.reflection.createdAt)],
      with: { module: { columns: { title: true } } },
    });
    const liveIt = await db.query.liveItProgress.findMany({
      where: eq(schema.liveItProgress.enrollmentId, enr.id),
      with: { item: { with: { module: { columns: { title: true } } } } },
    });
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "portal.export", entity: "Enrollment", entityId: enr.id });
    res.json({
      participantName: enr.user.name ?? enr.user.email,
      cohortName: enr.cohort.name,
      exportedAt: new Date(),
      portalClosesAt: enr.cohort.portalClosesAt ?? null,
      reflections: reflections.map((r) => ({
        id: r.id,
        kind: r.kind,
        promptKey: r.promptKey,
        moduleId: r.moduleId,
        moduleTitle: r.module?.title ?? null,
        body: r.body,
        createdAt: r.createdAt,
      })),
      liveIt: liveIt
        .filter((lp) => lp.checkedAt || lp.note)
        .map((lp) => ({
          moduleTitle: lp.item?.module?.title ?? "",
          label: lp.item?.label ?? "",
          checkedAt: lp.checkedAt,
          note: lp.note,
        })),
    });
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
