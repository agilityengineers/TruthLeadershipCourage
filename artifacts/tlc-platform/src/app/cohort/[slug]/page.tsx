import { Link, useParams } from "wouter";
import { useGetPublicCohort } from "@workspace/api-client-react";
import { formatDate, formatPrice, daysUntil } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, GraduationCap, ArrowRight } from "lucide-react";

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
        <Link href="/cohorts" className="hover:text-ink">
          Upcoming cohorts
        </Link>
        <Link href="/login" className="hover:text-ink">
          Sign in
        </Link>
      </div>
    </header>
  );
}

export default function CohortLandingPage() {
  const { slug } = useParams();
  const { data: cohort, isLoading, isError } = useGetPublicCohort(slug ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="mx-auto max-w-[860px] px-5 py-16 text-muted">Loading…</div>
      </div>
    );
  }

  if (isError || !cohort) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="mx-auto max-w-[860px] px-5 py-16">
          <h1 className="font-display text-[26px] text-ink">Cohort not found</h1>
          <p className="mt-2 text-muted">
            This cohort may have been renamed or is no longer available.{" "}
            <Link href="/cohorts" className="font-semibold text-eq hover:underline">
              See upcoming cohorts
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const open = cohort.status === "ENROLLING" && !cohort.isPrivate;
  const full = cohort.seatsLeft === 0;
  const enrollHref = `/enroll?cohort=${cohort.id}`;
  const closesIn = cohort.enrollByDate ? daysUntil(cohort.enrollByDate) : null;

  const facts: { icon: typeof Calendar; label: string; value: string }[] = [
    {
      icon: Calendar,
      label: "Runs",
      value: `${formatDate(cohort.startDate)} – ${formatDate(cohort.endDate)}`,
    },
    ...(cohort.sessionDay || cohort.sessionTime
      ? [
          {
            icon: Clock,
            label: "Weekly session",
            value: [cohort.sessionDay, cohort.sessionTime, cohort.timezone].filter(Boolean).join(" · "),
          },
        ]
      : []),
    {
      icon: MapPin,
      label: "Format",
      value: [FORMAT_LABEL[cohort.format] ?? cohort.format, cohort.location].filter(Boolean).join(" · "),
    },
    {
      icon: Users,
      label: "Seats",
      value:
        cohort.seatsLeft === null
          ? "Open enrollment"
          : cohort.seatsLeft > 0
            ? `${cohort.seatsLeft} of ${cohort.capacity} left`
            : "Full — waitlist open",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-ink">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hair-1 bg-soft-3">
        {cohort.heroImageUrl && (
          <img
            src={cohort.heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="relative mx-auto max-w-[860px] px-5 py-[clamp(40px,6vw,72px)]">
          <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-eq">
            {cohort.programName}
          </div>
          <h1 className="mt-2 font-display text-[clamp(30px,5vw,46px)] leading-[1.08] text-ink">{cohort.name}</h1>
          {cohort.tagline && <p className="mt-3 max-w-[620px] text-[17px] leading-relaxed text-muted">{cohort.tagline}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-display text-[26px] text-ink">
              {cohort.price > 0 ? formatPrice(cohort.price, cohort.currency) : "Free"}
            </span>
            <CohortCta open={open} full={full} href={enrollHref} isPrivate={cohort.isPrivate} status={cohort.status} />
            {open && closesIn !== null && closesIn <= 30 && (
              <span className="text-[12.5px] font-medium text-mq">
                {closesIn === 0 ? "Enrollment closes today" : `Closes in ${closesIn} day${closesIn === 1 ? "" : "s"}`}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[860px] gap-8 px-5 py-[clamp(32px,5vw,56px)] md:grid-cols-[1.6fr_1fr]">
        {/* Main column */}
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="font-display text-[20px] text-ink">About this cohort</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">
              {cohort.description ||
                cohort.programDescription ||
                `A ${cohort.totalWeeks}-week journey through ${cohort.programName}: Truth, Leadership, and Courage. Grow alongside a small cohort of peers with weekly live sessions, a physical workbook, and 1:1 coaching.`}
            </p>
          </section>

          {cohort.trainerName && (
            <section>
              <h2 className="font-display text-[20px] text-ink">Your trainer</h2>
              <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-hair-1 bg-soft-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-eq/10 text-eq">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{cohort.trainerName}</div>
                  {cohort.trainerTitle && <div className="text-[12.5px] text-muted-2">{cohort.trainerTitle}</div>}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar facts */}
        <aside className="flex flex-col gap-3 rounded-[16px] border border-hair-1 bg-white p-5 shadow-card md:sticky md:top-6 md:self-start">
          <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted-3">Details</div>
          {facts.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <f.icon size={17} className="mt-0.5 shrink-0 text-eq" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-muted-3">{f.label}</div>
                <div className="text-[13.5px] text-ink">{f.value}</div>
              </div>
            </div>
          ))}
          <div className="mt-2 border-t border-hair-1 pt-4">
            <CohortCta
              open={open}
              full={full}
              href={enrollHref}
              isPrivate={cohort.isPrivate}
              status={cohort.status}
              block
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function CohortCta({
  open,
  full,
  href,
  isPrivate,
  status,
  block,
}: {
  open: boolean;
  full: boolean;
  href: string;
  isPrivate: boolean;
  status: string;
  block?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[10px] px-5 py-3 text-[14px] font-semibold transition-colors";
  const width = block ? "w-full" : "";

  if (isPrivate) {
    return (
      <span className={`${base} ${width} cursor-default bg-soft-2 text-muted-2`}>
        Private cohort — invitation only
      </span>
    );
  }
  if (open) {
    return (
      <Link href={href} className={`${base} ${width} bg-eq text-white hover:bg-indigo`}>
        {full ? "Join the waitlist" : "Reserve your seat"} <ArrowRight size={16} />
      </Link>
    );
  }
  const label = status === "RUNNING" ? "This cohort is underway" : "Enrollment isn't open yet";
  return <span className={`${base} ${width} cursor-default bg-soft-2 text-muted-2`}>{label}</span>;
}
