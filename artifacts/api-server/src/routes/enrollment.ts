import { Router, type IRouter } from "express";
import { CreateEnrollmentBody, FulfillEnrollmentBody, MarkWeekCompleteBody } from "@workspace/api-zod";
import { db, schema, eq, and, or, ne, inArray, asc, count, gte, sql } from "../lib/db";
import { asyncHandler, HttpError, notFound, forbidden } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import {
  audit,
  evaluateCoupon,
  ensureChatThreads,
  notify,
  sendEmail,
  renderTemplate,
} from "../lib/services";
import { rateLimit, clientIp } from "../lib/ratelimit";

const router: IRouter = Router();

/** Public: cohorts open for enrollment + active companies. */
router.get(
  "/enroll/options",
  asyncHandler(async (_req, res) => {
    const cohorts = await db.query.cohort.findMany({
      where: and(
        eq(schema.cohort.isPrivate, false),
        inArray(schema.cohort.status, ["ENROLLING", "RUNNING"]),
      ),
      orderBy: [asc(schema.cohort.status), asc(schema.cohort.startDate)],
    });
    const counts = await db
      .select({ cohortId: schema.enrollment.cohortId, n: count() })
      .from(schema.enrollment)
      .groupBy(schema.enrollment.cohortId);
    const countMap = new Map(counts.map((c) => [c.cohortId, Number(c.n)]));
    const companies = await db.query.company.findMany({
      where: eq(schema.company.status, "ACTIVE"),
      orderBy: [asc(schema.company.name)],
      columns: { id: true, name: true },
    });
    res.json({
      cohorts: cohorts.map((c) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        currency: c.currency,
        seatsLeft: c.capacity > 0 ? Math.max(0, c.capacity - (countMap.get(c.id) ?? 0)) : null,
        status: c.status,
      })),
      companies,
    });
  }),
);

/**
 * Public: upcoming cohorts for the marketing "upcoming cohorts" page. Public
 * (non-private) cohorts that are enrolling or running and have not yet ended,
 * ordered by start date, with remaining seats when capacity is set.
 */
router.get(
  "/cohorts/upcoming",
  asyncHandler(async (_req, res) => {
    const cohorts = await db.query.cohort.findMany({
      where: and(
        eq(schema.cohort.isPrivate, false),
        inArray(schema.cohort.status, ["ENROLLING", "RUNNING"]),
        gte(schema.cohort.endDate, new Date()),
      ),
      orderBy: [asc(schema.cohort.startDate)],
    });
    const counts = await db
      .select({ cohortId: schema.enrollment.cohortId, n: count() })
      .from(schema.enrollment)
      .groupBy(schema.enrollment.cohortId);
    const countMap = new Map(counts.map((c) => [c.cohortId, Number(c.n)]));
    res.json({
      cohorts: cohorts.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        startDate: c.startDate,
        endDate: c.endDate,
        sessionDay: c.sessionDay,
        sessionTime: c.sessionTime,
        timezone: c.timezone,
        price: c.price,
        currency: c.currency,
        seatsLeft: c.capacity > 0 ? Math.max(0, c.capacity - (countMap.get(c.id) ?? 0)) : null,
        status: c.status,
      })),
    });
  }),
);

/** Public: capture enrollment intent (seat + PENDING payment, or waitlist). */
router.post(
  "/enrollments",
  asyncHandler(async (req, res) => {
    if (!rateLimit(`enroll:${clientIp(req)}`, { limit: 8, windowMs: 60 * 60_000 }).ok) {
      res.json({ ok: false, error: "Too many enrollment attempts. Please try again later." });
      return;
    }
    const data = CreateEnrollmentBody.parse(req.body);
    const email = data.email.toLowerCase();

    const cohort = await db.query.cohort.findFirst({ where: eq(schema.cohort.id, data.cohortId) });
    if (!cohort) {
      res.json({ ok: false, error: "Cohort not found" });
      return;
    }

    let user = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
    if (!user) {
      [user] = await db
        .insert(schema.user)
        .values({
          email,
          name: data.name,
          role: "PARTICIPANT",
          status: "invited",
          passwordHash: "demo-hash",
          companyId: data.companyId || null,
        })
        .returning();
    }

    if (data.responseId) {
      await db
        .update(schema.assessmentResponse)
        .set({ userId: user!.id })
        .where(
          and(
            eq(schema.assessmentResponse.id, data.responseId),
            sql`${schema.assessmentResponse.userId} is null`,
          ),
        );
    }

    const existing = await db.query.enrollment.findFirst({
      where: and(eq(schema.enrollment.userId, user!.id), eq(schema.enrollment.cohortId, cohort.id)),
    });
    if (existing) {
      res.json({
        ok: true,
        status: existing.status === "WAITLISTED" ? "WAITLISTED" : "ENROLLED",
        enrollmentId: existing.id,
      });
      return;
    }

    const [{ n } = { n: 0 }] = await db
      .select({ n: count() })
      .from(schema.enrollment)
      .where(eq(schema.enrollment.cohortId, cohort.id));
    if (cohort.capacity > 0 && Number(n) >= cohort.capacity) {
      const [{ w } = { w: 0 }] = await db
        .select({ w: count() })
        .from(schema.waitlistEntry)
        .where(eq(schema.waitlistEntry.cohortId, cohort.id));
      await db.insert(schema.waitlistEntry).values({
        cohortId: cohort.id,
        userId: user!.id,
        email,
        name: data.name,
        position: Number(w) + 1,
        status: "WAITING",
      });
      await audit({ actorId: user!.id, action: "waitlist.join", entity: "Cohort", entityId: cohort.id });
      res.json({ ok: true, status: "WAITLISTED" });
      return;
    }

    let amount = cohort.price;
    let couponId: string | undefined;
    if (data.coupon) {
      const result = await evaluateCoupon(data.coupon, cohort.price, cohort.id);
      if (result.valid) {
        amount = Math.max(0, cohort.price - result.discountCents);
        couponId = result.couponId;
      }
    }

    await db.insert(schema.consentRecord).values({ userId: user!.id, type: "terms", grantedAt: new Date() });

    const enrollmentId = await db.transaction(async (tx) => {
      const [seat] = await tx
        .insert(schema.seat)
        .values({
          cohortId: cohort.id,
          companyId: data.companyId || null,
          status: "ASSIGNED",
          assignedUserId: user!.id,
        })
        .returning();
      const [enr] = await tx
        .insert(schema.enrollment)
        .values({
          userId: user!.id,
          cohortId: cohort.id,
          companyId: data.companyId || null,
          seatId: seat!.id,
          status: "PENDING",
          shippingAddress: data.shipping,
        })
        .returning();
      await tx.insert(schema.shipment).values({ enrollmentId: enr!.id, status: "PENDING", address: data.shipping });
      await tx.insert(schema.payment).values({
        enrollmentId: enr!.id,
        companyId: data.companyId || null,
        processor: "STRIPE",
        amount,
        currency: cohort.currency,
        status: "PENDING",
        couponId: couponId ?? null,
      });
      if (couponId) {
        await tx
          .update(schema.coupon)
          .set({ redeemedCount: sql`${schema.coupon.redeemedCount} + 1` })
          .where(eq(schema.coupon.id, couponId));
      }
      return enr!.id;
    });

    await audit({
      actorId: user!.id,
      action: "enrollment.create",
      entity: "Enrollment",
      entityId: enrollmentId,
      meta: { cohortId: cohort.id },
    });
    res.json({ ok: true, status: "ENROLLED", enrollmentId });
  }),
);

/** Simulated payment webhook: PENDING → ACTIVE fulfillment (no external calls). */
router.post(
  "/enrollments/:id/fulfill",
  asyncHandler(async (req, res) => {
    const opts = FulfillEnrollmentBody.parse(req.body ?? {});
    const id = String(req.params.id);
    const enrollment = await db.query.enrollment.findFirst({
      where: eq(schema.enrollment.id, id),
      with: { user: true, cohort: { with: { trainer: true } }, payment: true, seat: true },
    });
    if (!enrollment) throw notFound("Enrollment not found");
    const alreadyFulfilled = enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED";

    await db.transaction(async (tx) => {
      if (enrollment.payment) {
        await tx
          .update(schema.payment)
          .set({
            status: "PAID",
            externalId: opts.externalId ?? enrollment.payment.externalId,
            processor: opts.processor ?? enrollment.payment.processor,
          })
          .where(eq(schema.payment.id, enrollment.payment.id));
      } else {
        await tx.insert(schema.payment).values({
          enrollmentId: enrollment.id,
          companyId: enrollment.companyId,
          processor: opts.processor ?? "STRIPE",
          externalId: opts.externalId ?? null,
          amount: opts.amount ?? enrollment.cohort.price,
          currency: enrollment.cohort.currency,
          status: "PAID",
        });
      }
      await tx
        .update(schema.enrollment)
        .set({ status: "ACTIVE", enrolledAt: enrollment.enrolledAt ?? new Date() })
        .where(eq(schema.enrollment.id, enrollment.id));
      if (enrollment.seatId) {
        await tx.update(schema.seat).set({ status: "CONSUMED" }).where(eq(schema.seat.id, enrollment.seatId));
      }
      const shipment = await tx.query.shipment.findFirst({
        where: eq(schema.shipment.enrollmentId, enrollment.id),
      });
      if (!shipment) {
        await tx.insert(schema.shipment).values({
          enrollmentId: enrollment.id,
          status: "PENDING",
          address: enrollment.shippingAddress ?? null,
        });
      }
      const [{ hp } = { hp: 0 }] = await tx
        .select({ hp: count() })
        .from(schema.moduleProgress)
        .where(eq(schema.moduleProgress.enrollmentId, enrollment.id));
      if (Number(hp) === 0) {
        const modules = await tx.query.module.findMany({
          where: eq(schema.module.programId, enrollment.cohort.programId),
          orderBy: [asc(schema.module.order)],
        });
        await tx.insert(schema.moduleProgress).values(
          Array.from({ length: 24 }, (_u, i) => {
            const w = i + 1;
            return {
              enrollmentId: enrollment.id,
              weekNo: w,
              moduleId: modules[(w - 1) % Math.max(modules.length, 1)]?.id ?? null,
              status: (w === 1 ? "AVAILABLE" : "LOCKED") as "AVAILABLE" | "LOCKED",
            };
          }),
        );
      }
    });

    await ensureChatThreads(enrollment.cohortId, enrollment.userId, enrollment.cohort.trainerId);

    if (!alreadyFulfilled) {
      await sendEmail({
        to: enrollment.user.email,
        subject: renderTemplate("Welcome to TLC — {{cohortName}}", { cohortName: enrollment.cohort.name }),
        html: renderTemplate(
          "<p>Welcome {{firstName}} — and thank you for answering the call.</p><p>Your seat in {{cohortName}} is confirmed.</p>",
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
    res.json({ ok: true });
  }),
);

/** Mark a participant's week complete; unlock the next week. */
router.post(
  "/enrollments/:id/complete-week",
  asyncHandler(async (req, res) => {
    const principal = await requirePrincipal(req);
    const { weekNo } = MarkWeekCompleteBody.parse(req.body);
    const enrollmentId = String(req.params.id);
    const enr = await db.query.enrollment.findFirst({ where: eq(schema.enrollment.id, enrollmentId) });
    if (!enr) throw notFound("Enrollment not found");
    const isStaff = principal.role === "ADMIN" || principal.role === "SUPER_ADMIN";
    if (enr.userId !== principal.id && !isStaff) throw forbidden();

    const completed = await db
      .update(schema.moduleProgress)
      .set({ status: "COMPLETED", completedAt: new Date() })
      .where(
        and(
          eq(schema.moduleProgress.enrollmentId, enrollmentId),
          eq(schema.moduleProgress.weekNo, weekNo),
          ...(isStaff ? [] : [eq(schema.moduleProgress.status, "AVAILABLE")]),
        ),
      )
      .returning({ id: schema.moduleProgress.id });
    if (completed.length === 0) throw new HttpError(400, "That week isn't available to complete yet.");

    await db
      .update(schema.moduleProgress)
      .set({ status: "AVAILABLE" })
      .where(
        and(
          eq(schema.moduleProgress.enrollmentId, enrollmentId),
          eq(schema.moduleProgress.weekNo, weekNo + 1),
          eq(schema.moduleProgress.status, "LOCKED"),
        ),
      );

    const [{ remaining } = { remaining: 0 }] = await db
      .select({ remaining: count() })
      .from(schema.moduleProgress)
      .where(
        and(
          eq(schema.moduleProgress.enrollmentId, enrollmentId),
          ne(schema.moduleProgress.status, "COMPLETED"),
        ),
      );
    if (Number(remaining) === 0) {
      await db
        .update(schema.enrollment)
        .set({ status: "COMPLETED", completedAt: new Date() })
        .where(eq(schema.enrollment.id, enrollmentId));
    }
    res.json({ ok: true });
  }),
);

export default router;
