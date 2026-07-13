import { requireRole } from "@/lib/session";
import { useGetPortalExport, type ReflectionItem } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { formatDate } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  SEED: "Where you started",
  I_AM: "Your I AM — every version",
  LEADERSHIP_WHY: "Why you lead",
  COMMITMENT: "Commitments",
  MODULE_CLOSING: "Closing reflections",
  MONDAY_MORNING: "Monday Morning Practice",
};
const KIND_ORDER = ["SEED", "I_AM", "LEADERSHIP_WHY", "COMMITMENT", "MODULE_CLOSING", "MONDAY_MORNING"];

/**
 * The keepsake: everything the participant wrote across the six months, in
 * one printable page, offered at graduation and again before the portal
 * closes. Their words were always theirs — this makes it literal.
 */
export default function KeepsakePage() {
  requireRole("PARTICIPANT", "ADMIN");
  const { data } = useGetPortalExport();

  if (!data) return <></>;

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    label: KIND_LABEL[kind] ?? kind,
    rows: data.reflections.filter((r) => r.kind === kind),
  })).filter((g) => g.rows.length > 0);
  const lived = data.liveIt.filter((l) => l.checkedAt);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label-caps">Everything you wrote</div>
          <h2 className="mt-0.5 font-display text-[20px] text-ink">Your record of the six months</h2>
          {data.portalClosesAt && (
            <p className="mt-1 text-[12.5px] text-muted-2">
              The portal closes {formatDate(data.portalClosesAt)} — this page and the download stay
              available until then.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `tlc-${data.participantName.replace(/\s+/g, "-").toLowerCase()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download JSON
          </Button>
          <PrintButton />
        </div>
      </div>

      <Card className="p-6 print:border-0 print:shadow-none">
        <div className="border-b border-hair-2 pb-4">
          <div className="label-caps">Truth · Leadership · Courage</div>
          <h1 className="mt-1 font-display text-[24px] text-ink">{data.participantName}</h1>
          <p className="text-[13px] text-muted-2">
            {data.cohortName} · exported {formatDate(data.exportedAt)}
          </p>
        </div>

        {grouped.map((g) => (
          <section key={g.kind} className="mt-6">
            <h3 className="font-display text-[15px] font-semibold text-indigo">{g.label}</h3>
            <div className="mt-2 flex flex-col gap-3">
              {g.rows.map((r) => (
                <ReflectionRow key={r.id} r={r} />
              ))}
            </div>
          </section>
        ))}

        {lived.length > 0 && (
          <section className="mt-6">
            <h3 className="font-display text-[15px] font-semibold text-teal">Practices you lived</h3>
            <div className="mt-2 flex flex-col gap-3">
              {lived.map((l, i) => (
                <div key={i}>
                  <div className="text-[12px] text-muted-3">
                    {l.moduleTitle} · {l.checkedAt ? formatDate(l.checkedAt) : ""}
                  </div>
                  <div className="text-[13.5px] text-ink">{l.label}</div>
                  {l.note && (
                    <p className="voice-participant mt-0.5 text-[14px] leading-relaxed text-[#43407a]">
                      “{l.note}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {grouped.length === 0 && lived.length === 0 && (
          <p className="mt-6 text-center text-[13.5px] text-muted-2">Nothing written yet.</p>
        )}
      </Card>
    </div>
  );
}

function ReflectionRow({ r }: { r: ReflectionItem }) {
  const context =
    r.kind === "SEED"
      ? r.promptKey === "seed.best_day"
        ? "On your best day"
        : "What made you say yes"
      : (r.moduleTitle ?? null);
  return (
    <div>
      <div className="text-[12px] text-muted-3">
        {context ? `${context} · ` : ""}
        {formatDate(r.createdAt)}
      </div>
      <p className="voice-participant text-[15px] leading-relaxed text-[#37345e]">“{r.body}”</p>
    </div>
  );
}
