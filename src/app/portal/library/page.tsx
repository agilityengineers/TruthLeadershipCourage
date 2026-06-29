import Image from "next/image";
import { requireRole } from "@/lib/session";
import { getParticipantContext } from "@/server/portal-data";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PillarBadge } from "@/components/brand/pillar-badge";

export const dynamic = "force-dynamic";

const PILLAR_ICON: Record<string, string> = {
  EQ: "selfdiscovery.png",
  IQ: "trust.png",
  MQ: "grit.png",
};

export default async function LibraryPage() {
  const principal = await requireRole("PARTICIPANT", "ADMIN");
  const enr = await getParticipantContext(principal.id);
  if (!enr) return <Card className="p-8 text-muted">No active enrollment.</Card>;

  // Library = all published program resources, grouped by pillar. Stays
  // accessible permanently (no phase gating).
  const modules = enr.cohort.program.modules;
  const byPillar: Record<string, typeof modules> = { EQ: [], IQ: [], MQ: [] };
  for (const m of modules) byPillar[m.pillar]?.push(m);

  const resources = await db.resource.findMany({
    where: { status: "PUBLISHED", programId: enr.cohort.programId },
    include: { module: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[18px] text-ink">Resource library</h3>
          <span className="text-[12px] font-medium text-muted-3">
            Always accessible · {modules.length} modules
          </span>
        </div>
        <p className="mb-5 text-[13.5px] text-muted-2">
          Your complete TLC library — recordings, worksheets, and coaching notes. Yours for life.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["EQ", "IQ", "MQ"] as const).map((pillar) => (
            <div key={pillar} className="rounded-[12px] border border-hair-2 p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <Image src={`/brand/${PILLAR_ICON[pillar]}`} alt="" width={30} height={30} className="h-[30px] w-[30px]" />
                <PillarBadge pillar={pillar} size="sm" />
              </div>
              <ul className="flex flex-col gap-1.5">
                {byPillar[pillar].map((m) => (
                  <li key={m.id} className="text-[13px] text-ink">
                    {m.title}
                  </li>
                ))}
                {byPillar[pillar].length === 0 && (
                  <li className="text-[12px] text-muted-3">Coming soon</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {resources.length > 0 && (
        <Card className="p-6">
          <h4 className="mb-3 font-display text-[16px] text-ink">Files</h4>
          <div className="flex flex-col gap-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.fileKey ?? "#"}
                className="flex items-center justify-between rounded-[10px] border border-hair-2 px-4 py-2.5 text-[13px] hover:bg-soft-1"
              >
                <span className="font-medium text-ink">{r.title}</span>
                <span className="text-[11px] uppercase tracking-label text-muted-3">{r.type}</span>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
