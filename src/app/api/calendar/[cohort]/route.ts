import { db } from "@/lib/db";
import { buildICS, type CalEvent } from "@/lib/ics";
import { getPrincipal } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/calendar/<cohortId>.ics — full session + coaching schedule. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cohort: string }> },
) {
  const principal = await getPrincipal();
  if (!principal) return new Response("Unauthorized", { status: 401 });

  const { cohort } = await params;
  const cohortId = cohort.replace(/\.ics$/, "");

  const events = await db.event.findMany({
    where: { cohortId },
    orderBy: { startAt: "asc" },
  });

  const cal: CalEvent[] = events.map((e) => ({
    uid: `${e.id}@thewisdomtri.com`,
    title: e.title,
    description: e.type === "COACHING_1ON1" ? "TLC 1:1 coaching session" : "TLC live session",
    location: e.joinUrl ?? "Virtual",
    start: e.startAt,
    end: e.endAt,
  }));

  const ics = buildICS(cal, "TLC Program");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="tlc-${cohortId}.ics"`,
    },
  });
}
