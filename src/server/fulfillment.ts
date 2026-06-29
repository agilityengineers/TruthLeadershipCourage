import { db } from "@/lib/db";
import { sendEmail, renderTemplate } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { audit } from "@/lib/audit";

/**
 * The processor-agnostic enrollment fulfillment path. Called by the Stripe and
 * ThriveCart webhooks on successful payment:
 *   payment -> PAID, enrollment -> ACTIVE, seat -> CONSUMED, shipment ensured
 *   PENDING, welcome email fired, chat threads wired, participant notified.
 */
export async function fulfillEnrollment(opts: {
  enrollmentId: string;
  externalId?: string;
  processor?: "STRIPE" | "THRIVECART" | "MANUAL";
  amount?: number;
}) {
  const enrollment = await db.enrollment.findUnique({
    where: { id: opts.enrollmentId },
    include: { user: true, cohort: { include: { trainer: true } }, payment: true, seat: true },
  });
  if (!enrollment) throw new Error("Enrollment not found");

  // Webhooks are delivered at-least-once. The DB writes below are all idempotent,
  // but the welcome email + notification are user-facing side effects — fire them
  // ONLY on the first PENDING→ACTIVE transition so retries don't double-send.
  const alreadyFulfilled = enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED";

  await db.$transaction(async (tx) => {
    // Payment → PAID (create if somehow missing).
    if (enrollment.payment) {
      await tx.payment.update({
        where: { id: enrollment.payment.id },
        data: {
          status: "PAID",
          externalId: opts.externalId ?? enrollment.payment.externalId,
          processor: opts.processor ?? enrollment.payment.processor,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          enrollmentId: enrollment.id,
          companyId: enrollment.companyId,
          processor: opts.processor ?? "STRIPE",
          externalId: opts.externalId,
          amount: opts.amount ?? enrollment.cohort.price,
          currency: enrollment.cohort.currency,
          status: "PAID",
        },
      });
    }

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "ACTIVE", enrolledAt: enrollment.enrolledAt ?? new Date() },
    });

    if (enrollment.seatId) {
      await tx.seat.update({ where: { id: enrollment.seatId }, data: { status: "CONSUMED" } });
    }

    // Ensure a workbook shipment exists (PENDING).
    const shipment = await tx.shipment.findUnique({ where: { enrollmentId: enrollment.id } });
    if (!shipment) {
      await tx.shipment.create({
        data: {
          enrollmentId: enrollment.id,
          status: "PENDING",
          address: enrollment.shippingAddress ?? undefined,
        },
      });
    }

    // Seed module progress if not present (week 1 available).
    const hasProgress = await tx.moduleProgress.count({ where: { enrollmentId: enrollment.id } });
    if (hasProgress === 0) {
      const modules = await tx.module.findMany({
        where: { programId: enrollment.cohort.programId },
        orderBy: { order: "asc" },
      });
      await tx.moduleProgress.createMany({
        data: Array.from({ length: 24 }, (_unused, i) => {
          const w = i + 1;
          return {
            enrollmentId: enrollment.id,
            weekNo: w,
            moduleId: modules[(w - 1) % Math.max(modules.length, 1)]?.id,
            status: w === 1 ? ("AVAILABLE" as const) : ("LOCKED" as const),
          };
        }),
      });
    }
  });

  // Wire chat: add to cohort channel; create 1:1 with the trainer. Idempotent.
  await ensureChatThreads(enrollment.cohortId, enrollment.userId, enrollment.cohort.trainerId);

  // User-facing side effects only on first fulfillment (see alreadyFulfilled).
  if (!alreadyFulfilled) {
    await sendEmail({
      to: enrollment.user.email,
      subject: renderTemplate("Welcome to TLC — {{cohortName}}", { cohortName: enrollment.cohort.name }),
      html: renderTemplate(
        "<p>Welcome {{firstName}} — and thank you for answering the call.</p><p>Your seat in {{cohortName}} is confirmed. Your workbook ships before kickoff, and your portal is ready.</p>",
        { firstName: enrollment.user.name?.split(" ")[0] ?? "there", cohortName: enrollment.cohort.name },
      ),
    });

    await notify({
      userId: enrollment.userId,
      type: "ENROLLMENT",
      title: `You're enrolled in ${enrollment.cohort.name}`,
      body: "Your portal is ready. Welcome to TLC.",
      href: "/portal",
    });
  }

  await audit({
    actorId: enrollment.userId,
    action: "enrollment.fulfilled",
    entity: "Enrollment",
    entityId: enrollment.id,
    meta: { processor: opts.processor, externalId: opts.externalId },
  });
}

async function ensureChatThreads(cohortId: string, userId: string, trainerId: string | null) {
  // Cohort channel membership.
  let channel = await db.thread.findFirst({ where: { cohortId, type: "COHORT_CHANNEL" } });
  if (!channel) {
    const cohort = await db.cohort.findUnique({ where: { id: cohortId } });
    channel = await db.thread.create({
      data: { type: "COHORT_CHANNEL", cohortId, title: `${cohort?.name ?? "Cohort"} channel` },
    });
  }
  const inChannel = await db.threadMember.findUnique({
    where: { threadId_userId: { threadId: channel.id, userId } },
  });
  if (!inChannel) await db.threadMember.create({ data: { threadId: channel.id, userId } });

  // 1:1 with trainer.
  if (trainerId) {
    const existing = await db.thread.findFirst({
      where: {
        type: "DIRECT",
        AND: [{ members: { some: { userId } } }, { members: { some: { userId: trainerId } } }],
      },
    });
    if (!existing) {
      await db.thread.create({
        data: {
          type: "DIRECT",
          members: { create: [{ userId }, { userId: trainerId }] },
        },
      });
    }
  }
}
