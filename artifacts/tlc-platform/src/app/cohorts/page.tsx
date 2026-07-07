import { Link } from "wouter";
import { useListPublicCohorts } from "@workspace/api-client-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";

const FORMAT_LABEL: Record<string, string> = {
  online: "Online · live video",
  in_person: "In person",
  hybrid: "Hybrid",
};

function PublicHeader() {
  return (
    <header className="flex items-center gap-3 px-5 py-4">
      <Link href="/" className="flex items-center gap-2.5">
        <img src="/brand/wisdomtri-logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px] object-contain" />
        <span className="text-[13px] font-semibold text-indigo">The Wisdom Tri</span>
      </Link>
      <div className="ml-auto flex items-center gap-4 text-[12.5px] font-semibold text-muted-3">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <Link href="/login" className="hover:text-ink">
          Sign in
        </Link>
      </div>
    </header>
  );
}

export default function CohortsIndexPage() {
  const { data, isLoading } = useListPublicCohorts();
  const cohorts = data ?? [];

  return (
    <div className="min-h-screen bg-white text-ink">
      <PublicHeader />

      <section className="border-b border-hair-1 bg-soft-3">
        <div className="mx-auto max-w-[880px] px-5 py-[clamp(36px,5vw,60px)]">
          <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-eq">Truth · Leadership · Courage</div>
          <h1 className="mt-2 font-display text-[clamp(28px,4.4vw,42px)] leading-[1.1] text-ink">Upcoming cohorts</h1>
          <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-muted">
            Choose the cohort that fits your calendar and reserve your seat. Each cohort is a small group moving through
            the six-month program together.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[880px] px-5 py-[clamp(28px,4vw,48px)]">
        {isLoading ? (
          <p className="text-muted">Loading…</p>
        ) : cohorts.length === 0 ? (
          <div className="rounded-[16px] border border-hair-1 bg-soft-3 p-10 text-center">
            <p className="font-display text-[18px] text-ink">No cohorts are open right now</p>
            <p className="mt-2 text-[14px] text-muted-2">
              New cohorts are announced regularly.{" "}
              <Link href="/book-a-call" className="font-semibold text-eq hover:underline">
                Book a call
              </Link>{" "}
              to hear about the next one.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cohorts.map((c) => (
              <Link
                key={c.id}
                href={`/cohort/${c.slug}`}
                className="group flex flex-col rounded-[16px] border border-hair-1 bg-white p-5 shadow-card transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-3">
                  <Calendar size={13} className="text-eq" />
                  {formatDate(c.startDate, { month: "short", year: "numeric" })} –{" "}
                  {formatDate(c.endDate, { month: "short", year: "numeric" })}
                </div>
                <h2 className="mt-2 font-display text-[20px] leading-tight text-ink">{c.name}</h2>
                {c.tagline && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-2">{c.tagline}</p>}

                <div className="mt-3 text-[12.5px] text-muted-2">
                  {[FORMAT_LABEL[c.format] ?? c.format, c.sessionDay ? `${c.sessionDay}s` : null, c.trainerName]
                    .filter(Boolean)
                    .join(" · ")}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-hair-1 pt-3">
                  <span className="font-display text-[17px] text-ink">
                    {c.price > 0 ? formatPrice(c.price, c.currency) : "Free"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-eq">
                    {c.seatsLeft === 0 ? "Waitlist" : "View cohort"}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
