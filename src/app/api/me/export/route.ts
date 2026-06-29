import { db } from "@/lib/db";
import { getPrincipal } from "@/lib/session";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GDPR data export — the signed-in user downloads everything we hold on them. */
export async function GET() {
  const principal = await getPrincipal();
  if (!principal) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { id: principal.id },
    include: {
      company: { select: { name: true } },
      enrollments: {
        include: { cohort: { select: { name: true } }, shipment: true, payment: true, moduleProgress: true, bookings: true, certificate: true },
      },
      assessmentResponses: { include: { answers: true } },
      consents: true,
      sentMessages: { select: { body: true, createdAt: true, threadId: true } },
      notifications: true,
    },
  });
  if (!user) return new Response("Not found", { status: 404 });

  // Strip the password hash from the export.
  const { passwordHash: _omit, ...safe } = user;

  await audit({ actorId: principal.id, action: "gdpr.export", entity: "User", entityId: principal.id });

  return new Response(JSON.stringify(safe, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tlc-data-${principal.id}.json"`,
    },
  });
}
