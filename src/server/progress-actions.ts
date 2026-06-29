"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";

/** Mark a participant's week complete; unlock the next week. */
export async function markWeekCompleteAction(enrollmentId: string, weekNo: number) {
  const principal = await requirePrincipal();
  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enr) throw new Error("Enrollment not found");
  // Participants may only act on their own enrollment; admins may act on any.
  if (enr.userId !== principal.id && principal.role !== "ADMIN" && principal.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  await db.moduleProgress.updateMany({
    where: { enrollmentId, weekNo },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  await db.moduleProgress.updateMany({
    where: { enrollmentId, weekNo: weekNo + 1, status: "LOCKED" },
    data: { status: "AVAILABLE" },
  });

  // Auto-complete enrollment when all weeks are done.
  const remaining = await db.moduleProgress.count({
    where: { enrollmentId, status: { not: "COMPLETED" } },
  });
  if (remaining === 0) {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/progress");
}
