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
  const isStaff = principal.role === "ADMIN" || principal.role === "SUPER_ADMIN";
  if (enr.userId !== principal.id && !isStaff) {
    throw new Error("Forbidden");
  }

  // A participant may only complete a week that is currently AVAILABLE — this
  // enforces the sequential unlock and rejects forged/out-of-order or
  // already-completed weeks sent straight to the action. Staff may override.
  const completed = await db.moduleProgress.updateMany({
    where: { enrollmentId, weekNo, ...(isStaff ? {} : { status: "AVAILABLE" }) },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  if (completed.count === 0) {
    throw new Error("That week isn't available to complete yet.");
  }
  await db.moduleProgress.updateMany({
    where: { enrollmentId, weekNo: weekNo + 1, status: "LOCKED" },
    data: { status: "AVAILABLE" },
  });

  // Auto-complete enrollment when all weeks are done. The certificate is NOT
  // auto-minted on self-report — a trainer/admin issues it (see
  // issueCertificateForEnrollment) so the credential reflects real sign-off.
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
