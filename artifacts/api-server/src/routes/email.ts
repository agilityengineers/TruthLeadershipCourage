import { Router, type IRouter } from "express";
import { SendCampaignBody } from "@workspace/api-zod";
import { db, schema, eq, and, inArray, desc, asc } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requireCapability } from "../lib/principal";
import { audit, sendEmail } from "../lib/services";

const router: IRouter = Router();

/** Admin communications: segments + templates + recent campaigns. */
router.get(
  "/admin/communications",
  asyncHandler(async (req, res) => {
    await requireCapability(req, "email:send");
    const [cohorts, companies, templates, campaigns] = await Promise.all([
      db.query.cohort.findMany({ orderBy: [desc(schema.cohort.startDate)], columns: { id: true, name: true } }),
      db.query.company.findMany({ orderBy: [asc(schema.company.name)], columns: { id: true, name: true } }),
      db.query.emailTemplate.findMany({ orderBy: [asc(schema.emailTemplate.name)] }),
      db.query.emailCampaign.findMany({ orderBy: [desc(schema.emailCampaign.createdAt)], limit: 10 }),
    ]);
    res.json({
      cohorts,
      companies,
      templates: templates.map((t) => ({ id: t.id, name: t.name, subject: t.subject, html: t.html })),
      campaigns: campaigns.map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        recipients: c.recipients,
        createdAt: c.createdAt,
      })),
    });
  }),
);

async function resolveRecipients(segment: { type: string; ids: string[] }) {
  const cols = { id: schema.user.id, email: schema.user.email, name: schema.user.name };
  switch (segment.type) {
    case "cohort": {
      const rows = await db
        .selectDistinct(cols)
        .from(schema.user)
        .innerJoin(schema.enrollment, eq(schema.enrollment.userId, schema.user.id))
        .where(inArray(schema.enrollment.cohortId, segment.ids.length ? segment.ids : ["__none__"]));
      return rows;
    }
    case "company":
      return db
        .select(cols)
        .from(schema.user)
        .where(
          and(
            inArray(schema.user.companyId, segment.ids.length ? segment.ids : ["__none__"]),
            eq(schema.user.role, "PARTICIPANT"),
          ),
        );
    case "individual":
      return db.select(cols).from(schema.user).where(inArray(schema.user.id, segment.ids.length ? segment.ids : ["__none__"]));
    case "all":
    default:
      return db.select(cols).from(schema.user).where(eq(schema.user.role, "PARTICIPANT"));
  }
}

/** Send a segmented broadcast (simulated) and record an EmailCampaign. */
router.post(
  "/admin/email/campaigns",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "email:send");
    const { subject, html, segment, templateId } = SendCampaignBody.parse(req.body);

    if (principal.role === "TRAINER" && segment.type === "cohort") {
      const owned = await db.query.cohort.findMany({
        where: and(
          inArray(schema.cohort.id, segment.ids.length ? segment.ids : ["__none__"]),
          eq(schema.cohort.trainerId, principal.id),
        ),
        columns: { id: true },
      });
      if (owned.length !== segment.ids.length) {
        res.json({ ok: false, error: "You can only email your own cohorts." });
        return;
      }
    } else if (principal.role === "TRAINER") {
      res.json({ ok: false, error: "Trainers can only broadcast to a cohort." });
      return;
    }

    const recipients = await resolveRecipients(segment);
    const emails = recipients.map((r) => r.email).filter(Boolean);

    const [campaign] = await db
      .insert(schema.emailCampaign)
      .values({
        templateId: templateId || null,
        subject,
        html,
        segment,
        cohortId: segment.type === "cohort" ? segment.ids[0] ?? null : null,
        sentById: principal.id,
        status: "sending",
        recipients: emails.length,
      })
      .returning();

    try {
      if (emails.length > 0) await sendEmail({ to: emails, subject, html });
      await db
        .update(schema.emailCampaign)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(schema.emailCampaign.id, campaign!.id));
    } catch (e) {
      await db.update(schema.emailCampaign).set({ status: "failed" }).where(eq(schema.emailCampaign.id, campaign!.id));
      res.json({ ok: false, error: `Send failed: ${(e as Error).message}` });
      return;
    }

    await audit({
      actorId: principal.id,
      action: "email.campaign",
      entity: "EmailCampaign",
      entityId: campaign!.id,
      meta: { recipients: emails.length, segment },
    });
    res.json({ ok: true, recipients: emails.length });
  }),
);

export default router;
