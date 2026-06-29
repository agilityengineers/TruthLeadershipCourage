import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { evaluateCoupon } from "@/lib/coupon";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const enrollSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  companyId: z.string().optional(),
  cohortId: z.string().min(1),
  responseId: z.string().optional(),
  coupon: z.string().optional(),
  shipping: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal: z.string().min(1),
    country: z.string().default("US"),
  }),
});

export type EnrollResult =
  | { ok: true; status: "ENROLLED" | "WAITLISTED"; enrollmentId?: string }
  | { ok: false; error: string };

/**
 * Capture enrollment intent. Creates (or reuses) the participant, reserves a
 * seat, records shipping, and creates a PENDING payment. The actual charge is a
 * BACKEND concern (Stripe/ThriveCart webhook) — no card UI here. If the cohort
 * is at capacity the prospect is added to the waitlist instead.
 */
export async function createEnrollment(input: z.infer<typeof enrollSchema>): Promise<EnrollResult> {
  // Unauthenticated + creates users/seats/payments → throttle per IP against spam.
  const ip = await clientIp();
  if (!rateLimit(`enroll:${ip}`, { limit: 8, windowMs: 60 * 60_000 }).ok) {
    return { ok: false, error: "Too many enrollment attempts. Please try again later." };
  }

  const parsed = enrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const cohort = await db.cohort.findUnique({
    where: { id: data.cohortId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!cohort) return { ok: false, error: "Cohort not found" };

  // Resolve or create participant.
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Invite-style: random password; the participant sets a real one on first login.
    const tmp = "demo-hash";
    user = await db.user.create({
      data: {
        email,
        name: data.name,
        role: "PARTICIPANT",
        status: "invited",
        passwordHash: tmp,
        companyId: data.companyId || null,
      },
    });
  }

  // Link any prior lead assessment response to this user.
  if (data.responseId) {
    await db.assessmentResponse.updateMany({
      where: { id: data.responseId, userId: null },
      data: { userId: user.id },
    });
  }

  // Already enrolled?
  const existing = await db.enrollment.findUnique({
    where: { userId_cohortId: { userId: user.id, cohortId: cohort.id } },
  });
  if (existing) {
    return { ok: true, status: existing.status === "WAITLISTED" ? "WAITLISTED" : "ENROLLED", enrollmentId: existing.id };
  }

  // Capacity check → waitlist.
  if (cohort.capacity > 0 && cohort._count.enrollments >= cohort.capacity) {
    const count = await db.waitlistEntry.count({ where: { cohortId: cohort.id } });
    await db.waitlistEntry.create({
      data: {
        cohortId: cohort.id,
        userId: user.id,
        email,
        name: data.name,
        position: count + 1,
        status: "WAITING",
      },
    });
    await audit({ actorId: user.id, action: "waitlist.join", entity: "Cohort", entityId: cohort.id });
    return { ok: true, status: "WAITLISTED" };
  }

  // Backend-apply a coupon if supplied (never shown as checkout UI).
  let amount = cohort.price;
  let couponId: string | undefined;
  if (data.coupon) {
    const result = await evaluateCoupon(data.coupon, cohort.price, cohort.id);
    if (result.valid) {
      amount = Math.max(0, cohort.price - result.discountCents);
      couponId = result.couponId;
    }
  }

  // Record marketing/privacy consent (GDPR).
  await db.consentRecord.create({
    data: { userId: user.id, type: "terms", grantedAt: new Date() },
  });

  // Reserve a seat + create the enrollment, shipment, and pending payment.
  const enrollment = await db.$transaction(async (tx) => {
    const seat = await tx.seat.create({
      data: {
        cohortId: cohort.id,
        companyId: data.companyId || null,
        status: "ASSIGNED",
        assignedUserId: user!.id,
      },
    });

    const enr = await tx.enrollment.create({
      data: {
        userId: user!.id,
        cohortId: cohort.id,
        companyId: data.companyId || null,
        seatId: seat.id,
        status: "PENDING",
        shippingAddress: data.shipping,
      },
    });

    await tx.shipment.create({
      data: { enrollmentId: enr.id, status: "PENDING", address: data.shipping },
    });

    await tx.payment.create({
      data: {
        enrollmentId: enr.id,
        companyId: data.companyId || null,
        processor: "STRIPE",
        amount,
        currency: cohort.currency,
        status: "PENDING",
        couponId,
      },
    });

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { redeemedCount: { increment: 1 } },
      });
    }

    return enr;
  });

  await audit({
    actorId: user.id,
    action: "enrollment.create",
    entity: "Enrollment",
    entityId: enrollment.id,
    meta: { cohortId: cohort.id },
  });

  return { ok: true, status: "ENROLLED", enrollmentId: enrollment.id };
}
