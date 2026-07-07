import { Link } from "wouter";
import { useGetUpcomingCohorts } from "@workspace/api-client-react";
import type { UpcomingCohort } from "@workspace/api-client-react";
import { LandingNav } from "@/components/marketing/landing-nav";
import { Footer } from "@/components/marketing/footer";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/lib/site-content";
import { formatDate, formatPrice } from "@/lib/utils";

type IntroCopy = { eyebrow: string; heading: string; intro: string; emptyState: string };

const INTRO_FALLBACK: IntroCopy = {
  eyebrow: "Upcoming cohorts",
  heading: "Find the cohort that fits your season.",
  intro:
    "Every cohort runs six months — live, virtual, and small by design. Browse the cohorts opening next and reserve your seat while they're still enrolling.",
  emptyState:
    "No cohorts are open for enrollment right now. Book a fit conversation and we'll let you know the moment the next one opens.",
};

/** Short time-zone label (e.g. "PDT") for the cohort's start date, if resolvable. */
function tzAbbrev(tz: string | null | undefined, ref: string): string | null {
  if (!tz) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date(ref));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? null;
  } catch {
    return null;
  }
}

function statusPill(cohort: UpcomingCohort): { label: string; color: string; bg: string } {
  if (cohort.status === "ENROLLING") {
    return { label: "Enrolling now", color: "#0f7a4d", bg: "#e7f5ee" };
  }
  const started = new Date(cohort.startDate).getTime() <= Date.now();
  return started
    ? { label: "In session", color: "#55596e", bg: "#f0f1f6" }
    : { label: "Starting soon", color: "#662d91", bg: "#f2ecf8" };
}

function CohortCard({ cohort }: { cohort: UpcomingCohort }) {
  const pill = statusPill(cohort);
  const enrolling = cohort.status === "ENROLLING";
  const soldOut = cohort.seatsLeft === 0;

  const schedule = [
    cohort.sessionDay ? `${cohort.sessionDay}s` : null,
    cohort.sessionTime,
    tzAbbrev(cohort.timezone, cohort.startDate),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col rounded-[16px] border border-hair-1 bg-white p-[26px] shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="font-display text-[21px] leading-tight text-ink">{cohort.name}</h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.04em]"
          style={{ color: pill.color, background: pill.bg }}
        >
          {pill.label}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="label-caps mb-[5px]">Dates</dt>
          <dd className="text-[14px] leading-snug text-ink">
            {formatDate(cohort.startDate)} – {formatDate(cohort.endDate)}
          </dd>
        </div>
        {schedule && (
          <div>
            <dt className="label-caps mb-[5px]">Sessions</dt>
            <dd className="text-[14px] leading-snug text-ink">{schedule}</dd>
          </div>
        )}
        <div>
          <dt className="label-caps mb-[5px]">Investment</dt>
          <dd className="text-[14px] leading-snug text-ink">{formatPrice(cohort.price, cohort.currency)}</dd>
        </div>
        <div>
          <dt className="label-caps mb-[5px]">Seats</dt>
          <dd className="text-[14px] leading-snug text-ink">
            {cohort.seatsLeft === null
              ? "Limited by design"
              : soldOut
                ? "Full — join the waitlist"
                : `${cohort.seatsLeft} left`}
          </dd>
        </div>
      </dl>

      <div className="mt-6 pt-5 border-t border-hair-1">
        {enrolling ? (
          <Button asChild size="md" variant={soldOut ? "outline" : "primary"}>
            <Link href="/enroll">{soldOut ? "Join the waitlist →" : "Reserve your seat →"}</Link>
          </Button>
        ) : (
          <Button asChild size="md" variant="outline">
            <Link href="/book-a-call">Book a fit call →</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function UpcomingCohortsPage() {
  const { ready, content } = usePageContent("cohorts");
  const nav = content("global.nav");
  const footer = content("global.footer");
  const copy = (content("cohorts.intro") ?? INTRO_FALLBACK) as IntroCopy;

  const { data } = useGetUpcomingCohorts();
  const cohorts = data?.cohorts ?? [];

  if (!ready) return <div className="min-h-screen bg-white" />;

  return (
    <div className="bg-white text-ink">
      {nav && <LandingNav content={nav as Parameters<typeof LandingNav>[0]["content"]} />}

      <section className="border-b border-[#eef0f5] bg-soft-3">
        <div className="shell py-[clamp(44px,6vw,72px)]">
          <Eyebrow color="#662d91" rule className="mb-[18px]">
            {copy.eyebrow}
          </Eyebrow>
          <h1 className="mb-4 max-w-[18ch] text-[clamp(30px,4vw,46px)] leading-[1.08] text-ink">{copy.heading}</h1>
          <p className="max-w-[58ch] text-[15px] leading-relaxed text-muted">{copy.intro}</p>
        </div>
      </section>

      <section className="shell py-[clamp(40px,5vw,64px)]">
        {cohorts.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-hair-2 bg-soft-3 p-[clamp(28px,4vw,44px)] text-center">
            <p className="mx-auto max-w-[46ch] text-[15px] leading-relaxed text-muted">{copy.emptyState}</p>
            <div className="mt-5">
              <Button asChild size="md">
                <Link href="/book-a-call">Book a fit call →</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {cohorts.map((c) => (
              <CohortCard key={c.id} cohort={c} />
            ))}
          </div>
        )}
      </section>

      {footer && (
        <Footer
          content={footer as Parameters<typeof Footer>[0]["content"]}
          crossLink={{ label: "← Back to TLC for Leaders", href: "/" }}
        />
      )}
    </div>
  );
}
