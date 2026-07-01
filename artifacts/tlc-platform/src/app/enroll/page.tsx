import { Link, useSearch } from "wouter";
import { useGetEnrollOptions } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { EnrollForm } from "./enroll-form";
import { usePageContent } from "@/lib/site-content";

export default function EnrollPage() {
  const params = new URLSearchParams(useSearch());
  const response = params.get("response") ?? undefined;

  const { data } = useGetEnrollOptions();
  const cohorts = data?.cohorts ?? [];
  const companies = data?.companies ?? [];

  const copy = (usePageContent("enroll").content("enroll.intro") ?? {
    heading: "Confirm your seat in the cohort",
    intro: "Choose your cohort, tell us where to ship your physical workbook, and we'll handle the rest.",
    disclaimer: "Payment is handled securely and separately — no card details are entered here.",
  }) as { heading: string; intro: string; disclaimer: string };

  const primary = cohorts[0];

  return (
    <div className="min-h-screen bg-soft-3 px-5 py-[clamp(24px,5vw,60px)] pb-16">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-7 flex items-center gap-3">
          <img src="/brand/wisdomtri-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <div className="text-[13px] font-semibold leading-tight text-indigo">The Wisdom Tri</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-muted-3">
              Reserve your seat
            </div>
          </div>
          <Link href="/" className="ml-auto text-[12.5px] font-semibold text-muted-3 hover:text-ink">
            Exit
          </Link>
        </div>

        <div className="rounded-[18px] border border-hair-1 bg-white p-[clamp(24px,4vw,40px)] shadow-card">
          <h1 className="font-display text-[clamp(24px,3.2vw,32px)] text-ink">{copy.heading}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {copy.intro}{" "}
            {primary && (
              <>
                Investment for {primary.name}:{" "}
                <span className="font-semibold text-ink">{formatPrice(primary.price, primary.currency)}</span>.
              </>
            )}
          </p>

          {cohorts.length === 0 ? (
            <p className="mt-6 text-muted">No cohorts are open for enrollment right now.</p>
          ) : (
            <EnrollForm responseId={response} cohorts={cohorts} companies={companies} />
          )}
        </div>
        <p className="mt-4 text-center text-[12.5px] text-[#a2a6b8]">{copy.disclaimer}</p>
      </div>
    </div>
  );
}
