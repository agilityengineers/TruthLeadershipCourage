"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const segmentSchema = z.object({
  type: z.enum(["cohort", "company", "individual", "all"]),
  ids: z.array(z.string()).default([]),
});

/** Resolve a segment to recipient users. */
async function resolveRecipients(segment: z.infer<typeof segmentSchema>) {
  switch (segment.type) {
    case "cohort":
      return db.user.findMany({
        where: { enrollments: { some: { cohortId: { in: segment.ids } } } },
        select: { id: true, email: true, name: true },
      });
    case "company":
      return db.user.findMany({
        where: { companyId: { in: segment.ids }, role: "PARTICIPANT" },
        select: { id: true, email: true, name: true },
      });
    case "individual":
      return db.user.findMany({
        where: { id: { in: segment.ids } },
        select: { id: true, email: true, name: true },
      });
    case "all":
      return db.user.findMany({
        where: { role: "PARTICIPANT" },
        select: { id: true, email: true, name: true },
      });
  }
}

/**
 * Send a segmented broadcast via SendGrid and record an EmailCampaign.
 * Trainers may send to their own cohorts; admins to anyone.
 */
export async function sendCampaign(input: {
  subject: string;
  html: string;
  segment: z.infer<typeof segmentSchema>;
  templateId?: string;
}) {
  const principal = await requireCapability("email:send");
  const { subject, html, segment, templateId } = z
    .object({
      subject: z.string().min(1),
      html: z.string().min(1),
      segment: segmentSchema,
      templateId: z.string().optional(),
    })
    .parse(input);

  // Trainers are restricted to their own cohorts.
  if (principal.role === "TRAINER" && segment.type === "cohort") {
    const owned = await db.cohort.findMany({
      where: { id: { in: segment.ids }, trainerId: principal.id },
      select: { id: true },
    });
    if (owned.length !== segment.ids.length) {
      return { ok: false as const, error: "You can only email your own cohorts." };
    }
  } else if (principal.role === "TRAINER") {
    return { ok: false as const, error: "Trainers can only broadcast to a cohort." };
  }

  const recipients = await resolveRecipients(segment);
  const emails = recipients.map((r) => r.email).filter(Boolean);

  const campaign = await db.emailCampaign.create({
    data: {
      templateId: templateId || null,
      subject,
      html,
      segment,
      cohortId: segment.type === "cohort" ? segment.ids[0] : null,
      sentById: principal.id,
      status: "sending",
      recipients: emails.length,
    },
  });

  try {
    if (emails.length > 0) {
      await sendEmail({ to: emails, subject, html });
    }
    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "sent", sentAt: new Date() },
    });
  } catch (e) {
    await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: "failed" } });
    return { ok: false as const, error: `Send failed: ${(e as Error).message}` };
  }

  await audit({
    actorId: principal.id,
    action: "email.campaign",
    entity: "EmailCampaign",
    entityId: campaign.id,
    meta: { recipients: emails.length, segment },
  });
  revalidatePath("/admin/communications");
  revalidatePath("/trainer/messages");
  return { ok: true as const, recipients: emails.length };
}
