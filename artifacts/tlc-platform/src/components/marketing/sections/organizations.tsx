import { Link } from "wouter";
import { LeadershipModel } from "@/components/marketing/leadership-model";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";

type Img = { src: string; alt: string };
type Lnk = { label: string; href: string };
type SC = Record<string, unknown>;

const STAT_COLORS = ["#024794", "#262161", "#662d91"];
const DIFF_COLORS = ["#024794", "#262161", "#662d91"];

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[20px] leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-[3px] text-[10px] font-medium leading-snug tracking-[.04em] text-[#8a8fa3]">
        {label}
      </div>
    </div>
  );
}

function DiffColumn({ title, items, color }: { title: string; items: { text: string }[]; color: string }) {
  return (
    <div className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
      <div className="label-caps mb-4" style={{ color }}>
        {title}
      </div>
      <ul className="grid gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[14.5px] leading-[1.5] text-[#4c5066]">
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Quote({ text, name, role }: { text: string; name: string; role: string }) {
  return (
    <div className="rounded-[14px] border border-hair-2 bg-white p-[28px]">
      <p className="mb-5 font-display text-[17px] italic leading-[1.55] text-[#2b2747]">“{text}”</p>
      <div className="text-[14px] font-semibold text-indigo">{name}</div>
      <div className="mt-[3px] text-[12.5px] leading-snug text-muted-3">{role}</div>
    </div>
  );
}

export function OrgHero({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headlineLead: string;
    headlineEmphasis: string;
    body: string;
    primaryCta: Lnk;
    secondaryCta: Lnk;
    image: Img;
    stats: { value: string; label: string }[];
  };
  return (
    <section className="shell grid items-center gap-[clamp(28px,5vw,60px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[1.04fr_.96fr]">
      <div>
        <Eyebrow color="#024794" rule className="mb-[22px]">
          {c.eyebrow}
        </Eyebrow>
        <h1 className="mb-5 text-[clamp(36px,4.6vw,54px)] leading-[1.05] text-ink">
          {c.headlineLead} <em className="italic text-eq">{c.headlineEmphasis}</em>
        </h1>
        <p className="mb-[30px] max-w-[32em] text-[18px] leading-[1.55] text-[#4c5066]">{c.body}</p>
        <div className="mb-6 flex flex-wrap items-center gap-3.5">
          <Button asChild size="lg">
            <Link href={c.primaryCta.href}>{c.primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={c.secondaryCta.href}>{c.secondaryCta.label}</Link>
          </Button>
        </div>
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

export function OrgProblem({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    body: string;
    quote: string;
  };
  return (
    <section className="shell section-y">
      <Eyebrow className="mb-3.5">{c.eyebrow}</Eyebrow>
      <h2 className="mb-2 max-w-[18em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <p className="mb-10 max-w-[42em] text-[17px] leading-[1.55] text-muted">{c.body}</p>
      <div className="mx-auto max-w-[40em] rounded-[14px] border-l-[3px] border-mq bg-[#f6f4fb] px-[30px] py-[26px]">
        <p className="font-display text-[19px] italic leading-[1.5] text-[#2b2747]">{c.quote}</p>
      </div>
    </section>
  );
}

export function OrgFormula({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    summaryTop: string;
    summaryBottom: string;
    paragraphs: { text: string }[];
  };
  return (
    <div className="border-t border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="mb-[34px] text-center">
          <Eyebrow color="#024794" className="mb-3.5 justify-center">
            {c.eyebrow}
          </Eyebrow>
          <h2 className="text-[clamp(26px,3.2vw,38px)] leading-[1.12] text-ink">
            {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
          </h2>
        </div>
        <div className="grid items-center gap-[clamp(30px,5vw,56px)] lg:grid-cols-[1fr_.92fr]">
          <LeadershipModel className="mx-auto w-full max-w-[460px]" />
          <div>
            <div className="mb-7 rounded-[16px] border border-hair-2 bg-white p-[26px] shadow-card">
              <div className="font-display text-[18px] leading-[1.42] text-ink">{c.summaryTop}</div>
              <div className="mt-2 font-display text-[18px] leading-[1.42] text-mq">{c.summaryBottom}</div>
              <div className="label-caps mt-3.5">EQ + IQ + MQ™</div>
            </div>
            {c.paragraphs.map((p, i) => (
              <p key={i} className="mb-3.5 text-[16px] leading-[1.6] text-[#4c5066] last:mb-0">
                {p.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrgScales({ content }: { content: SC }) {
  const c = content as { eyebrow: string; heading: string; body: string };
  return (
    <div className="bg-[linear-gradient(160deg,#262161,#1b1942_60%,#024794)] text-white">
      <div className="shell grid items-center gap-6 py-[clamp(46px,5vw,68px)] md:grid-cols-[1.3fr_1fr]">
        <div>
          <Eyebrow color="#a9b8e0" className="mb-3">
            {c.eyebrow}
          </Eyebrow>
          <h3 className="text-[clamp(23px,2.6vw,30px)] leading-[1.18] text-white">{c.heading}</h3>
        </div>
        <p className="text-[16px] leading-[1.6] text-[#cdd6ee]">{c.body}</p>
      </div>
    </div>
  );
}

export function OrgWhatChanges({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    items: { title: string; body: string }[];
    quote: string;
    quoteName: string;
    quoteRole: string;
  };
  return (
    <section className="shell section-y">
      <Eyebrow color="#024794" className="mb-3.5">
        {c.eyebrow}
      </Eyebrow>
      <h2 className="mb-[42px] max-w-[18em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <div className="grid grid-cols-1 gap-x-[26px] gap-y-6 sm:grid-cols-2">
        {c.items.map((w) => (
          <div key={w.title} className="flex gap-3.5">
            <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-eq" />
            <div>
              <h4 className="mb-1 text-[17px] text-ink">{w.title}</h4>
              <p className="text-[14.5px] leading-[1.55] text-[#62657a]">{w.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[42px] rounded-[14px] border border-hair-2 p-[26px]">
        <p className="font-display text-[17px] italic leading-[1.5] text-[#2b2747]">“{c.quote}”</p>
        <div className="mt-3 text-[13px] font-semibold text-indigo">
          {c.quoteName} <span className="font-medium text-muted-3">· {c.quoteRole}</span>
        </div>
      </div>
    </section>
  );
}

export function OrgDifference({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    howTitle: string;
    how: { text: string }[];
    returnTitle: string;
    returns: { text: string }[];
    forOrgsTitle: string;
    forOrgs: { text: string }[];
  };
  return (
    <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(48px,6vw,76px)]">
        <Eyebrow className="mb-3.5">{c.eyebrow}</Eyebrow>
        <h2 className="mb-[36px] max-w-[20em] text-[clamp(26px,3vw,36px)] leading-[1.12] text-ink">
          {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
        </h2>
        <div className="grid grid-cols-1 gap-[26px] md:grid-cols-3">
          <DiffColumn title={c.howTitle} items={c.how} color={DIFF_COLORS[0]} />
          <DiffColumn title={c.returnTitle} items={c.returns} color={DIFF_COLORS[1]} />
          <DiffColumn title={c.forOrgsTitle} items={c.forOrgs} color={DIFF_COLORS[2]} />
        </div>
      </div>
    </div>
  );
}

export function OrgBuiltFor({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    paragraphs: { text: string }[];
    engagementTitle: string;
    engagement: { label: string; value: string }[];
  };
  return (
    <section className="shell section-y grid items-center gap-[clamp(28px,5vw,56px)] lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <Eyebrow color="#024794" className="mb-3.5">
          {c.eyebrow}
        </Eyebrow>
        <h2 className="mb-3.5 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
          {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
        </h2>
        {c.paragraphs.map((p, i) => (
          <p key={i} className="mb-3.5 text-[16.5px] leading-[1.6] text-[#4c5066] last:mb-0">
            {p.text}
          </p>
        ))}
      </div>
      <div className="rounded-[16px] border border-hair-2 bg-white p-[28px] shadow-card">
        <div className="label-caps mb-4">{c.engagementTitle}</div>
        <ul className="grid gap-3.5">
          {c.engagement.map((e) => (
            <li
              key={e.label}
              className="flex items-baseline justify-between gap-4 border-b border-hair-2 pb-3 last:border-0 last:pb-0"
            >
              <span className="font-display text-[16px] text-ink">{e.label}</span>
              <span className="text-right text-[13px] leading-snug text-muted-2">{e.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function OrgProof({ content }: { content: SC }) {
  const c = content as { eyebrow: string; quotes: { text: string; name: string; role: string }[] };
  return (
    <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(48px,6vw,76px)]">
        <Eyebrow color="#024794" className="mb-[26px]">
          {c.eyebrow}
        </Eyebrow>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {c.quotes.map((q, i) => (
            <Quote key={i} text={q.text} name={q.name} role={q.role} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrgGetStarted({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    body: string;
    primaryCta: Lnk;
    secondaryCta: Lnk;
  };
  return (
    <div className="bg-[linear-gradient(160deg,#1b1942,#262161_55%,#024794)] text-white">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="max-w-[34em]">
          <Eyebrow color="#b8d8e6" className="mb-4">
            {c.eyebrow}
          </Eyebrow>
          <h2 className="mb-[18px] text-[clamp(30px,3.6vw,44px)] leading-[1.06] text-white">
            {c.headingLead} <em className="italic text-sky">{c.headingEmphasis}</em>
          </h2>
          <p className="mb-[30px] text-[17px] leading-[1.55] text-[#cdd6ee]">{c.body}</p>
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
      </div>
    </div>
  );
}
