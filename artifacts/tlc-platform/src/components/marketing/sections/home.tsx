import { Link } from "wouter";
import { useGetUpcomingCohorts } from "@workspace/api-client-react";
import { LeadershipModel } from "@/components/marketing/leadership-model";
import { OperatingSystemCard } from "@/components/marketing/operating-system-card";
import { FAQ } from "@/components/marketing/faq";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type Img = { src: string; alt: string };
type Lnk = { label: string; href: string };
type SC = Record<string, unknown>;

const PILLAR_DOT: Record<string, string> = { EQ: "#024794", IQ: "#262161", MQ: "#662d91" };
function dotColor(tag: string) {
  return PILLAR_DOT[tag.replace(/[™\s]/g, "")] ?? "#662d91";
}

const STAT_COLORS = ["#024794", "#262161", "#662d91"];

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[22px] leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-[3px] text-[10px] font-medium leading-snug tracking-[.04em] text-[#8a8fa3]">
        {label}
      </div>
    </div>
  );
}

function PromiseStat({ value, label, valueColor = "#fff" }: { value: string; label: string; valueColor?: string }) {
  return (
    <div>
      <div className="font-display text-[38px] leading-none" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-[#b8c6e8]">{label}</div>
    </div>
  );
}

/**
 * The next cohort a visitor can act on, shown beside the hero's primary CTA.
 * Auto-populated from live data: the soonest cohort open for enrollment (the
 * upcoming list is already sorted by start date), falling back to the soonest
 * upcoming cohort. Links to that cohort's own landing page so the button flow
 * — hero → cohort dates → this cohort → reserve a seat — is visible end to end.
 */
function NextCohortLink() {
  const { data } = useGetUpcomingCohorts();
  const cohorts = data?.cohorts ?? [];
  const next = cohorts.find((co) => co.status === "ENROLLING") ?? cohorts[0];
  if (!next) return null;
  return (
    <Link
      href={`/cohort/${next.slug}`}
      className="group flex flex-col rounded-[12px] border border-[#d6d9e6] px-[18px] py-2.5 transition-colors hover:border-eq"
      aria-label={`Next cohort begins ${formatDate(next.startDate)} — view ${next.name}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[.11em] text-[#8a8fa3]">
        Next cohort begins
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 font-display text-[16px] leading-tight text-ink group-hover:text-eq">
        {formatDate(next.startDate)}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}

export function HomeHero({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headlineLead: string;
    headlineEmphasis: string;
    body: string;
    primaryCta: Lnk;
    microcopy: string;
    image: Img;
    stats: { value: string; label: string }[];
  };
  return (
    <section className="shell grid items-center gap-[clamp(28px,5vw,60px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[1.04fr_.96fr]">
      <div>
        <Eyebrow color="#662d91" rule className="mb-[22px]">
          {c.eyebrow}
        </Eyebrow>
        <h1 className="mb-5 text-[clamp(38px,5vw,58px)] leading-[1.04] text-ink">
          {c.headlineLead} <em className="italic text-eq">{c.headlineEmphasis}</em>
        </h1>
        <p className="mb-[30px] max-w-[30em] text-[18px] leading-[1.55] text-[#4c5066]">{c.body}</p>
        <div className="mb-6 flex flex-wrap items-center gap-3.5">
          <Button asChild size="lg">
            <Link href={c.primaryCta.href}>{c.primaryCta.label}</Link>
          </Button>
          <NextCohortLink />
        </div>
        <div className="text-[13px] font-medium leading-[1.5] text-[#8a8fa3]">{c.microcopy}</div>
      </div>
      <div className="relative">
        <img
          src={c.image.src}
          alt={c.image.alt}
          width={900}
          height={1100}
          className="block w-full rounded-[18px] shadow-hero"
        />
        <div className="absolute -left-4 bottom-6 flex items-center gap-4 rounded-[14px] bg-white px-[18px] py-4 shadow-float">
          {c.stats.map((s, i) => (
            <span key={s.label + i} className="flex items-center gap-4">
              {i > 0 && <span className="h-[34px] w-px bg-[#ececf2]" />}
              <Stat value={s.value} label={s.label} color={STAT_COLORS[i % STAT_COLORS.length]} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeTrustStrip({ content }: { content: SC }) {
  const c = content as { label: string; quote: string; attribution: string };
  return (
    <div className="border-y border-[#eef0f5] bg-[#fafbfd]">
      <div className="shell flex flex-wrap items-center gap-4 py-4">
        <span className="text-[11.5px] font-semibold uppercase tracking-[.13em] text-muted-3">{c.label}</span>
        <span className="text-[#dfe2ec]">·</span>
        <span className="min-w-[260px] flex-1 font-display text-[15px] italic leading-snug text-[#3c3c52]">
          “{c.quote}”
        </span>
        <span className="text-[12px] font-semibold text-muted-2">{c.attribution}</span>
      </div>
    </div>
  );
}

export function HomeProblem({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    body: string;
    challenges: { number: string; title: string; body: string }[];
    pullQuote: string;
  };
  return (
    <section id="why" className="shell section-y">
      <Eyebrow className="mb-3.5">{c.eyebrow}</Eyebrow>
      <h2 className="mb-2 max-w-[16em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <p className="mb-10 max-w-[40em] text-[17px] leading-[1.55] text-muted">{c.body}</p>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {c.challenges.map((ch) => (
          <div key={ch.number}>
            <div className="mb-3 font-display text-[15px] text-[#c3c6d4]">{ch.number}</div>
            <h4 className="mb-[7px] text-[18px] text-indigo">{ch.title}</h4>
            <p className="text-[14px] leading-[1.5] text-[#62657a]">{ch.body}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-[42px] max-w-[40em] rounded-[14px] border-l-[3px] border-mq bg-[#f6f4fb] px-[30px] py-[26px]">
        <p className="font-display text-[19px] italic leading-[1.5] text-[#2b2747]">{c.pullQuote}</p>
      </div>
    </section>
  );
}

export function HomePromise({ content }: { content: SC }) {
  const c = content as { eyebrow: string; heading: string; stats: { value: string; label: string }[] };
  return (
    <div className="bg-[linear-gradient(160deg,#262161,#1b1942_60%,#024794)] text-white">
      <div className="shell grid items-center gap-6 py-[clamp(46px,5vw,68px)] md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Eyebrow color="#a9b8e0" className="mb-3">
            {c.eyebrow}
          </Eyebrow>
          <h3 className="text-[25px] leading-[1.18] text-white">{c.heading}</h3>
        </div>
        {c.stats.map((s, i) => (
          <PromiseStat key={s.label + i} value={s.value} label={s.label} valueColor={i === 2 ? "#b8d8e6" : "#fff"} />
        ))}
      </div>
    </div>
  );
}

export function HomeGuide({ content }: { content: SC }) {
  const c = content as {
    image: Img;
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    role: string;
    paragraphs: { text: string }[];
    cta: Lnk;
  };
  return (
    <section id="guide" className="shell section-y grid items-center gap-[clamp(28px,5vw,56px)] lg:grid-cols-[.9fr_1.1fr]">
      <img
        src={c.image.src}
        alt={c.image.alt}
        width={900}
        height={1000}
        className="w-full rounded-[18px] shadow-[0_20px_50px_rgba(26,24,48,.16)]"
      />
      <div>
        <Eyebrow color="#024794" className="mb-3.5">
          {c.eyebrow}
        </Eyebrow>
        <h2 className="mb-2 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
          {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
        </h2>
        <p className="mb-[18px] text-[14px] font-medium leading-snug text-muted-3">{c.role}</p>
        {c.paragraphs.map((p, i) => (
          <p key={i} className="mb-3.5 text-[16.5px] leading-[1.6] text-[#4c5066] last:mb-6">
            {p.text}
          </p>
        ))}
        <Button asChild variant="outline">
          <Link href={c.cta.href}>{c.cta.label}</Link>
        </Button>
      </div>
    </section>
  );
}

export function HomePlan({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    steps: { step: string; title: string; body: string }[];
    osEyebrow: string;
    osHeadingLead: string;
    osHeadingEmphasis: string;
    summaryTop: string;
    summaryBottom: string;
    pillars: { eyebrow: string; title: string; body: string }[];
  };
  return (
    <div id="program" className="border-t border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="mb-[46px] text-center">
          <Eyebrow className="mb-3.5 justify-center">{c.eyebrow}</Eyebrow>
          <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
            {c.headingLead} <em className="mt-1 block italic text-eq">{c.headingEmphasis}</em>
          </h2>
        </div>
        <div className="mb-[54px] grid grid-cols-1 gap-5 md:grid-cols-3">
          {c.steps.map((s) => (
            <div key={s.step} className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
              <div className="mb-3.5 font-display text-[14px] text-eq">{s.step}</div>
              <h4 className="mb-2 text-[20px] text-ink">{s.title}</h4>
              <p className="text-[14.5px] leading-[1.55] text-[#62657a]">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mb-[34px] text-center">
          <Eyebrow color="#024794" className="mb-3.5 justify-center">
            {c.osEyebrow}
          </Eyebrow>
          <h3 className="text-[clamp(24px,3vw,34px)] leading-[1.12] text-ink">
            {c.osHeadingLead} <em className="italic text-mq">{c.osHeadingEmphasis}</em>
          </h3>
        </div>
        <div className="grid items-center gap-[clamp(30px,5vw,56px)] lg:grid-cols-[1fr_.92fr]">
          <LeadershipModel className="mx-auto w-full max-w-[460px]" />
          <div>
            <OperatingSystemCard className="mb-7" />

            <div className="grid gap-[18px]">
              {c.pillars.map((m) => (
                <div key={m.title} className="flex gap-3.5">
                  <span className="mt-[6px] h-3 w-3 shrink-0 rounded-full" style={{ background: dotColor(m.eyebrow) }} />
                  <div>
                    <h4 className="mb-0.5 text-[17px] text-ink">
                      {m.title} <span className="label-caps inline-block">· {m.eyebrow}</span>
                    </h4>
                    <p className="text-[14px] leading-[1.5] text-[#62657a]">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeOutcomes({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    items: { icon: Img; title: string; body: string }[];
  };
  return (
    <section className="shell section-y">
      <Eyebrow color="#024794" className="mb-3.5">
        {c.eyebrow}
      </Eyebrow>
      <h2 className="mb-[42px] max-w-[18em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {c.items.map((o) => (
          <div
            key={o.title}
            className="flex gap-3.5 rounded-[14px] border border-hair-2 bg-white p-[22px] shadow-card"
          >
            <img src={o.icon.src} alt={o.icon.alt} width={44} height={44} className="h-11 w-11 shrink-0" />
            <div>
              <h4 className="mb-1 text-[17px] text-ink">{o.title}</h4>
              <p className="text-[14px] leading-[1.5] text-[#62657a]">{o.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeGlance({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    items: { label: string; value: string; sub: string }[];
    footnote: string;
  };
  return (
    <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(48px,6vw,76px)]">
        <Eyebrow className="mb-[18px]">{c.eyebrow}</Eyebrow>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-hair-1 bg-hair-1 sm:grid-cols-2 lg:grid-cols-4">
          {c.items.map((g) => (
            <div key={g.label} className="bg-white p-[22px]">
              <div className="label-caps mb-[9px]">{g.label}</div>
              <div className="font-display text-[19px] leading-tight text-ink">{g.value}</div>
              <div className="mt-[5px] text-[13px] leading-snug text-muted-2">{g.sub}</div>
            </div>
          ))}
        </div>
        <Link
          href="/cohorts"
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-eq transition-colors hover:text-indigo hover:underline"
        >
          {c.footnote}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

export function HomeStories({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    heading: string;
    items: { quote: string; name: string; role: string }[];
  };
  return (
    <section id="stories" className="shell section-y">
      <Eyebrow color="#024794" className="mb-3.5">
        {c.eyebrow}
      </Eyebrow>
      <h2 className="mb-[42px] text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">{c.heading}</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {c.items.map((s) => (
          <div key={s.name} className="rounded-[14px] border border-hair-2 p-[26px]">
            <p className="mb-5 font-display text-[17px] italic leading-[1.5] text-[#2b2747]">“{s.quote}”</p>
            <div className="text-[14px] font-semibold text-indigo">{s.name}</div>
            <div className="mt-[3px] text-[12.5px] leading-snug text-muted-3">{s.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FitMark() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} className="mt-[2px] h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#e4f1ea" />
      <path
        d="M5.8 10.4l2.6 2.6L14.2 7.2"
        fill="none"
        stroke="#1c7d4d"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotYetMark() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} className="mt-[2px] h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#eceef4" />
      <path d="M6.4 10h7.2" fill="none" stroke="#9498ab" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HomeWhoFor({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    intro: string;
    forTitle: string;
    forItems: { text: string }[];
    notTitle: string;
    notItems: { text: string }[];
  };
  return (
    <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="max-w-[44em]">
          <Eyebrow color="#662d91" className="mb-3.5">
            {c.eyebrow}
          </Eyebrow>
          <h2 className="mb-3.5 text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
            {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
          </h2>
          <p className="mb-[42px] text-[17px] leading-[1.6] text-muted">{c.intro}</p>
        </div>
        <div className="grid grid-cols-1 gap-[26px] md:grid-cols-2">
          <div className="rounded-[14px] border border-hair-2 bg-white p-[28px] shadow-card">
            <div className="label-caps mb-[18px]" style={{ color: "#1c7d4d" }}>
              {c.forTitle}
            </div>
            <ul className="grid gap-3.5">
              {c.forItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-[1.5] text-[#3c3c52]">
                  <FitMark />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border border-hair-2 bg-white p-[28px]">
            <div className="label-caps mb-[18px]">{c.notTitle}</div>
            <ul className="grid gap-3.5">
              {c.notItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-[1.5] text-[#62657a]">
                  <NotYetMark />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeFinalCta({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    body: string;
    primaryCta: Lnk;
    secondaryCta: Lnk;
    faqs: { q: string; a: string }[];
  };
  return (
    <div className="bg-[linear-gradient(160deg,#1b1942,#262161_55%,#024794)] text-white">
      <div className="shell grid items-start gap-[clamp(30px,5vw,64px)] py-[clamp(56px,7vw,92px)] lg:grid-cols-2">
        <div>
          <Eyebrow color="#b8d8e6" className="mb-4">
            {c.eyebrow}
          </Eyebrow>
          <h2 className="mb-[18px] text-[clamp(30px,3.6vw,44px)] leading-[1.06] text-white">
            {c.headingLead} <em className="italic text-sky">{c.headingEmphasis}</em>
          </h2>
          <p className="mb-[30px] max-w-[26em] text-[17px] leading-[1.55] text-[#cdd6ee]">{c.body}</p>
          <div className="flex flex-wrap gap-3.5">
            <Button asChild size="lg" variant="light" className="font-bold">
              <Link href={c.primaryCta.href}>{c.primaryCta.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href={c.secondaryCta.href}>{c.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
        <FAQ items={c.faqs} />
      </div>
    </div>
  );
}
