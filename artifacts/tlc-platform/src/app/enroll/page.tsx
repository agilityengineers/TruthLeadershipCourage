import { Link, useSearch } from "wouter";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { EnrollForm } from "./enroll-form";

export default function EnrollPage() {
  const params = new URLSearchParams(useSearch());
  const response = params.get("response") ?? undefined;

  // Public cohorts open for enrollment (enrolling first, then running).
  const cohorts = db.cohort.findMany({
    where: { isPrivate: false, status: { in: ["ENROLLING", "RUNNING"] } },
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
    include: { _count: { select: { enrollments: true } } },
  });
  const companies = db.company.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const primary = cohorts[0];

  return (
    <div className="min-h-screen bg-soft-3 px-5 py-[clamp(24px,5vw,60px)] pb-16">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-7 flex items-center gap-3">
          <img src="/brand/wisdomtri-logo.jpg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
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
          <h1 className="font-display text-[clamp(24px,3.2vw,32px)] text-ink">
            Confirm your seat in the cohort
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Choose your cohort, tell us where to ship your physical workbook, and we'll handle the
            rest. {primary && (
              <>
                Investment for {primary.name}:{" "}
                <span className="font-semibold text-ink">{formatPrice(primary.price, primary.currency)}</span>.
              </>
            )}
          </p>

          {cohorts.length === 0 ? (
            <p className="mt-6 text-muted">No cohorts are open for enrollment right now.</p>
          ) : (
            <EnrollForm
              responseId={response}
              cohorts={cohorts.map((c) => ({
                id: c.id,
                name: c.name,
                price: c.price,
                currency: c.currency,
                seatsLeft: c.capacity > 0 ? Math.max(0, c.capacity - c._count.enrollments) : null,
                status: c.status,
              }))}
              companies={companies}
            />
          )}
        </div>
        <p className="mt-4 text-center text-[12.5px] text-[#a2a6b8]">
          Payment is handled securely and separately — no card details are entered here.
        </p>
      </div>
    </div>
  );
}
