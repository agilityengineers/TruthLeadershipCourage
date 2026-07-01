import { Router, type IRouter } from "express";
import { SetConsentBody } from "@workspace/api-zod";
import { db, schema, eq, and, desc, isNull } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit } from "../lib/services";

const router: IRouter = Router();

/** Notifications: recent + mark-all-read. */
router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const items = await db.query.notification.findMany({
      where: eq(schema.notification.userId, p.id),
      orderBy: [desc(schema.notification.createdAt)],
      limit: 15,
    });
    res.json(items);
  }),
);

router.post(
  "/notifications/read-all",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    await db
      .update(schema.notification)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notification.userId, p.id), isNull(schema.notification.readAt)));
    res.json({ ok: true });
  }),
);

/** Account settings + GDPR consent/erasure. */
router.get(
  "/account/settings",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, p.id),
      with: { consents: { orderBy: [desc(schema.consentRecord.createdAt)] } },
    });
    const marketing = user?.consents.find((c) => c.type === "marketing");
    const marketingGranted = marketing ? Boolean(marketing.grantedAt && !marketing.revokedAt) : false;
    res.json({
      user: { name: user?.name ?? null, email: user?.email ?? "", status: user?.status ?? null },
      marketingGranted,
      deletionRequested: user?.status === "deletion_requested",
    });
  }),
);

router.post(
  "/account/consent",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { type, granted } = SetConsentBody.parse(req.body);
    await db.insert(schema.consentRecord).values({
      userId: p.id,
      type,
      grantedAt: granted ? new Date() : null,
      revokedAt: granted ? null : new Date(),
    });
    await audit({
      actorId: p.id,
      action: granted ? "consent.grant" : "consent.revoke",
      entity: "User",
      entityId: p.id,
      meta: { type },
    });
    res.json({ ok: true });
  }),
);

router.post(
  "/account/deletion-request",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    await db.update(schema.user).set({ status: "deletion_requested" }).where(eq(schema.user.id, p.id));
    await audit({ actorId: p.id, action: "gdpr.deletion_request", entity: "User", entityId: p.id });
    res.json({ ok: true });
  }),
);

export default router;
