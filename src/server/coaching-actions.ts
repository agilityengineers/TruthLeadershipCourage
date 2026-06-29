"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({ bookingId: z.string(), slot: z.string() });

/** Reschedule a coaching 1:1. Participant (owner) or trainer/admin. */
export async function rescheduleBooking(input: z.infer<typeof schema>) {
  const { bookingId, slot } = schema.parse(input);
  const principal = await requirePrincipal();
  const booking = await db.coachingBooking.findUnique({
    where: { id: bookingId },
    include: { enrollment: true },
  });
  if (!booking) return { ok: false as const, error: "Booking not found" };

  const isOwner = booking.enrollment.userId === principal.id;
  const isStaff = ["TRAINER", "ADMIN", "SUPER_ADMIN"].includes(principal.role);
  if (!isOwner && !isStaff) return { ok: false as const, error: "Forbidden" };

  const when = new Date(slot);
  if (Number.isNaN(when.getTime())) return { ok: false as const, error: "Invalid date/time" };

  await db.coachingBooking.update({
    where: { id: bookingId },
    data: { slot: when, status: "RESCHEDULED" },
  });
  await audit({
    actorId: principal.id,
    action: "coaching.reschedule",
    entity: "CoachingBooking",
    entityId: bookingId,
    meta: { slot },
  });
  revalidatePath("/portal/coaching");
  revalidatePath("/portal");
  return { ok: true as const };
}
