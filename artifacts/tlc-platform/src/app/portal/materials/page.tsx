import { requireRole } from "@/lib/session";
import { useGetPortalMaterials } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { PillarBadge } from "@/components/brand/pillar-badge";
import { FileText, Film, LinkIcon, Printer, Download } from "lucide-react";

export default function MaterialsPage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data: resources = [] } = useGetPortalMaterials();

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <h3 className="mb-1 font-display text-[18px] text-ink">Training materials</h3>
        <p className="mb-5 text-[13.5px] text-muted-2">
          Weekly worksheets and resources — download or print-ready for your physical workbook.
        </p>
        {resources.length === 0 ? (
          <p className="text-[13px] text-muted">
            Materials appear here each week as your trainer publishes them.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {resources.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-[11px] border border-hair-2 px-4 py-3"
              >
                <ResourceIcon type={r.type} />
                {r.module && <PillarBadge pillar={r.module.pillar} size="sm" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{r.title}</div>
                  {r.description && (
                    <div className="truncate text-[12px] text-muted-2">{r.description}</div>
                  )}
                </div>
                {r.fileKey && (
                  <a
                    href={r.fileKey}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-eq"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
                {r.printReady && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-3">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ResourceIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  if (type === "MP4") return <Film className={`${cls} text-mq`} />;
  if (type === "LINK") return <LinkIcon className={`${cls} text-iq`} />;
  return <FileText className={`${cls} text-eq`} />;
}
