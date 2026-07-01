import { Router, type IRouter } from "express";
import { RescheduleBookingBody } from "@workspace/api-zod";
import { db, schema, eq } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requirePrincipal } from "../lib/principal";
import { audit } from "../lib/services";

const router: IRouter = Router();

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
    await audit({ actorId: p.id, action: "coaching.reschedule", entity: "CoachingBooking", entityId: bookingId, meta: { slot } });
    res.json({ ok: true });
  }),
);

export default router;
