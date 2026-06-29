import { requireRole } from "@/lib/session";
import { getParticipantContext } from "@/server/portal-data";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

export default function CertificatePage() {
  const principal = requireRole("PARTICIPANT", "ADMIN");
  const enr = getParticipantContext(principal.id);
  const cert = enr?.certificate;

  if (!enr || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft-3 text-muted">
        Certificate not available yet — complete all 24 weeks to unlock it.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-3 px-5 py-10">
      <div className="mx-auto max-w-[840px]">
        <div className="no-print mb-4 flex justify-end">
          <PrintButton />
        </div>

        <div className="relative overflow-hidden rounded-[18px] border-[6px] border-double border-[#262161] bg-white p-12 text-center shadow-card">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(2,71,148,.04),rgba(102,45,145,.04))]" />
          <div className="relative">
            <div className="mb-6 flex justify-center">
              <img src="/brand/wisdomtri-logo.jpg" alt="The Wisdom Tri" width={72} height={72} className="h-[72px] w-[72px] object-contain" />
            </div>
            <div className="eyebrow mb-4 text-mq">Certificate of Completion</div>
            <h1 className="font-display text-[clamp(28px,4vw,44px)] text-ink">{enr.user.name}</h1>
            <p className="mx-auto mt-4 max-w-[40em] text-[16px] leading-relaxed text-muted">
              has successfully completed the <span className="font-semibold text-ink">Truth · Leadership · Courage</span>{" "}
              six-month leadership program — {enr.cohort.name} — built on the EQ · IQ · MQ™ method.
            </p>
            <div className="mt-10 flex items-end justify-between">
              <div className="text-left">
                <div className="font-display text-[18px] italic text-indigo">Tri T. Nguyen</div>
                <div className="text-[12px] text-muted-2">Founder, The Wisdom Tri</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-ink">
                  {formatDate(cert.issuedAt, { month: "long", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-[11px] text-muted-3">Serial {cert.serial}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
