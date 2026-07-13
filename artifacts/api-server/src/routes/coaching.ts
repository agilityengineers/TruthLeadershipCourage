import { Router, type IRouter } from "express";
import { BookCoachingSessionBody, RescheduleBookingBody } from "@workspace/api-zod";
import { db, schema, eq, and, inArray } from "../lib/db";
import { asyncHandler, badRequest, HttpError } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit, notify } from "../lib/services";
import {
  INCLUDED_COACHING_SESSIONS,
  isPortalClosed,
  moduleWindows,
  programBounds,
} from "../lib/portalState";
import { loadParticipantContext } from "./portal";

const router: IRouter = Router();

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
/** Offered daily start times, UTC hours (9am / 10am / 1pm Pacific in the demo). */
const SLOT_HOURS_UTC = [16, 17, 20];

/** The cohort's Intersession window, derived from its module map. */
function intersessionWindow(cohort: NonNullable<Awaited<ReturnType<typeof loadParticipantContext>>>["cohort"]) {
  const bounds = programBounds(moduleWindows(cohort));
  const start = new Date(new Date(cohort.startDate).getTime() + bounds.lastS1Week * WEEK_MS);
  const end = new Date(new Date(cohort.startDate).getTime() + (bounds.firstS2Week - 1) * WEEK_MS);
  return { start, end };
}

/**
 * Bookable Intersession slots: weekday times inside the Intersession window,
 * minus anything the trainer already has booked. (Simulated availability —
 * a real calendar integration would replace the generator, not the API.)
 */
router.get(
  "/coaching/slots",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const enr = await loadParticipantContext(p.id);
    if (!enr) {
      res.json({ slots: [], intersessionStart: null, intersessionEnd: null, bookedCount: 0, includedSessions: INCLUDED_COACHING_SESSIONS });
      return;
    }
    const { start, end } = intersessionWindow(enr.cohort);
    const now = new Date();
    const from = now > start ? now : start;

    const trainerId = enr.cohort.trainerId;
    const taken = trainerId
      ? await db.query.coachingBooking.findMany({
          where: and(
            eq(schema.coachingBooking.trainerId, trainerId),
            inArray(schema.coachingBooking.status, ["SCHEDULED", "RESCHEDULED"]),
          ),
          columns: { slot: true },
        })
      : [];
    const takenTimes = new Set(taken.map((t) => new Date(t.slot).getTime()));

    const slots: Date[] = [];
    for (let d = new Date(from); d <= end && slots.length < 24; d = new Date(d.getTime() + DAY_MS)) {
      const day = d.getUTCDay();
      if (day === 0 || day === 6) continue;
      for (const h of SLOT_HOURS_UTC) {
        const slot = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h));
        if (slot <= now || slot > end) continue;
        if (!takenTimes.has(slot.getTime())) slots.push(slot);
      }
    }
    const bookedCount = (enr.bookings ?? []).filter(
      (b) => b.status === "SCHEDULED" || b.status === "RESCHEDULED" || b.status === "COMPLETED",
    ).length;
    res.json({
      slots,
      intersessionStart: start,
      intersessionEnd: end,
      bookedCount,
      includedSessions: INCLUDED_COACHING_SESSIONS,
    });
  }),
);

/** Book an Intersession coaching 1:1 (self-serve). */
router.post(
  "/coaching/bookings",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { slot } = BookCoachingSessionBody.parse(req.body);
    const enr = await loadParticipantContext(p.id);
    if (!enr) throw badRequest("No active enrollment");
    if (isPortalClosed(enr.cohort)) throw new HttpError(410, "The portal has closed.");

    const when = new Date(slot);
    if (Number.isNaN(when.getTime())) throw badRequest("Invalid date/time");
    const { start, end } = intersessionWindow(enr.cohort);
    if (when < start || when > end) throw badRequest("Coaching sessions are booked inside the Intersession");
    if (when <= new Date()) throw badRequest("That time has passed");

    const active = (enr.bookings ?? []).filter(
      (b) => b.status === "SCHEDULED" || b.status === "RESCHEDULED" || b.status === "COMPLETED",
    );
    if (active.length >= INCLUDED_COACHING_SESSIONS)
      throw badRequest("Both included coaching sessions are already scheduled");

    const trainerId = enr.cohort.trainerId;
    if (trainerId) {
      const clash = await db.query.coachingBooking.findFirst({
        where: and(
          eq(schema.coachingBooking.trainerId, trainerId),
          eq(schema.coachingBooking.slot, when),
          inArray(schema.coachingBooking.status, ["SCHEDULED", "RESCHEDULED"]),
        ),
      });
      if (clash) throw badRequest("That time was just taken — pick another");
    }

    const [booking] = await db
      .insert(schema.coachingBooking)
      .values({
        enrollmentId: enr.id,
        trainerId: trainerId ?? null,
        slot: when,
        status: "SCHEDULED",
        sequence: active.length + 1,
      })
      .returning();
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "coaching.book", entity: "CoachingBooking", entityId: booking!.id, meta: { slot } });
    if (trainerId) {
      await notify({
        userId: trainerId,
        type: "UPCOMING_SESSION",
        title: `${enr.user.name ?? "A participant"} booked a coaching 1:1`,
        body: when.toUTCString(),
        href: "/trainer",
      });
    }
    const trainer = trainerId
      ? await db.query.user.findFirst({ where: eq(schema.user.id, trainerId), columns: { id: true, name: true, email: true, image: true, title: true } })
      : null;
    res.json({ id: booking!.id, slot: booking!.slot, status: booking!.status, sequence: booking!.sequence, trainer });
  }),
);

/** Reschedule a coaching 1:1. Participant (owner) or trainer/admin. */
router.post(
  "/coaching/bookings/:id/reschedule",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const { slot } = RescheduleBookingBody.parse(req.body);
    const bookingId = String(req.params.id);
    const booking = await db.query.coachingBooking.findFirst({
      where: eq(schema.coachingBooking.id, bookingId),
      with: { enrollment: true },
    });
    if (!booking) {
      res.json({ ok: false, error: "Booking not found" });
      return;
    }
    const isOwner = booking.enrollment?.userId === p.id;
    const isStaff = ["TRAINER", "ADMIN", "SUPER_ADMIN"].includes(p.role);
    if (!isOwner && !isStaff) {
      res.json({ ok: false, error: "Forbidden" });
      return;
    }
    const when = new Date(slot);
    if (Number.isNaN(when.getTime())) {
      res.json({ ok: false, error: "Invalid date/time" });
      return;
    }
    await db
      .update(schema.coachingBooking)
      .set({ slot: when, status: "RESCHEDULED" })
      .where(eq(schema.coachingBooking.id, bookingId));
    await audit({ actorId: p.id, impersonatorId: p.impersonatorId, action: "coaching.reschedule", entity: "CoachingBooking", entityId: bookingId, meta: { slot } });
    res.json({ ok: true });
  }),
);

export default router;
