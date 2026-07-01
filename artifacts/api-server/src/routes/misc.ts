import { Router, type IRouter } from "express";
import { db, schema, eq, asc } from "../lib/db";
import { asyncHandler } from "../lib/http";
import { requirePrincipal } from "../lib/principal";

const router: IRouter = Router();

function ics(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function esc(s: string) {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Public calendar feed of a cohort's weekly sessions. */
router.get(
  "/calendar/:file",
  asyncHandler(async (req, res) => {
    const cohortId = String(req.params.file).replace(/\.ics$/i, "");
    const cohort = await db.query.cohort.findFirst({ where: eq(schema.cohort.id, cohortId) });
    if (!cohort) {
      res.status(404).type("text/plain").send("Cohort not found");
      return;
    }
    const events = await db.query.event.findMany({
      where: eq(schema.event.cohortId, cohortId),
      orderBy: [asc(schema.event.startAt)],
    });
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Wisdom Tri//TLC Platform//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(cohort.name)} — TLC`,
    ];
    for (const e of events) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${e.id}@tlc`,
        `DTSTAMP:${ics(new Date())}`,
        `DTSTART:${ics(e.startAt)}`,
        `DTEND:${ics(e.endAt)}`,
        `SUMMARY:${esc(e.title)}`,
        e.joinUrl ? `LOCATION:${esc(e.joinUrl)}` : "",
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    res.type("text/calendar").send(lines.filter(Boolean).join("\r\n"));
  }),
);

/** GDPR data export: everything we hold about the current user. */
router.get(
  "/account/export",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, p.id),
      with: {
        enrollments: { with: { moduleProgress: true, payment: true, shipment: true, certificate: true, bookings: true } },
        assessmentResponses: { with: { answers: true } },
        consents: true,
        notifications: true,
      },
    });
    res.setHeader("Content-Disposition", 'attachment; filename="tlc-my-data.json"');
    res.json(user ?? {});
  }),
);

export default router;
