import { Link } from "wouter";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";

type Img = { src: string; alt: string };
type Lnk = { label: string; href: string };
type SC = Record<string, unknown>;

const ACCENTS = ["#024794", "#262161", "#662d91"];

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

export function AboutTriHero({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    pronounce: string;
    role: string;
    paragraphs: { text: string }[];
    image: Img;
    primaryCta: Lnk;
    secondaryCta: Lnk;
    stats: { value: string; label: string }[];
  };
  return (
    <section className="shell grid items-center gap-[clamp(28px,5vw,56px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[.92fr_1.08fr]">
      <div className="relative order-2 lg:order-1">
        <img
          src={c.image.src}
          alt={c.image.alt}
          width={900}
          height={1000}
          className="block w-full rounded-[18px] shadow-hero"
        />
        {c.stats?.length > 0 && (
          <div className="absolute -left-4 bottom-6 flex items-center gap-4 rounded-[14px] bg-white px-[18px] py-4 shadow-float">
            {c.stats.map((s, i) => (
              <span key={s.label + i} className="flex items-center gap-4">
                {i > 0 && <span className="h-[34px] w-px bg-[#ececf2]" />}
                <Stat value={s.value} label={s.label} color={ACCENTS[i % ACCENTS.length]} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="order-1 lg:order-2">
        <Eyebrow color="#024794" rule className="mb-[18px]">
          {c.eyebrow}
        </Eyebrow>
        <h1 className="mb-3 text-[clamp(38px,5vw,58px)] leading-[1.04] text-ink">
          {c.headingLead} <em className="italic text-eq">{c.headingEmphasis}</em>
        </h1>
        {c.pronounce && (
          <p className="mb-4 font-display text-[16px] italic leading-snug text-muted-2">{c.pronounce}</p>
        )}
        {c.role && <p className="label-caps mb-[22px] !text-muted-3">{c.role}</p>}
        {c.paragraphs.map((p, i) => (
          <p key={i} className="mb-3.5 max-w-[34em] text-[16.5px] leading-[1.6] text-[#4c5066]">
            {p.text}
          </p>
        ))}
        <div className="mt-6 flex flex-wrap items-center gap-3.5">
          <Button asChild size="lg">
            <Link href={c.primaryCta.href}>{c.primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={c.secondaryCta.href}>{c.secondaryCta.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AboutTriStory({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    paragraphs: { text: string }[];
    pullQuote: string;
    image: Img;
  };
  return (
    <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="grid items-center gap-[clamp(30px,5vw,56px)] lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <Eyebrow className="mb-3.5">{c.eyebrow}</Eyebrow>
            <h2 className="mb-6 max-w-[16em] text-[clamp(27px,3.2vw,38px)] leading-[1.12] text-ink">
              {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
            </h2>
            {c.paragraphs.map((p, i) => (
              <p key={i} className="mb-3.5 text-[16.5px] leading-[1.65] text-[#4c5066] last:mb-0">
                {p.text}
              </p>
            ))}
          </div>
          <img
            src={c.image.src}
            alt={c.image.alt}
            width={800}
            height={800}
            className="w-full rounded-[18px] shadow-[0_20px_50px_rgba(26,24,48,.16)]"
          />
        </div>
        {c.pullQuote && (
          <div className="mt-[42px] rounded-[14px] border-l-[3px] border-mq bg-white px-[30px] py-[26px] shadow-card">
            <p className="max-w-[44em] font-display text-[19px] italic leading-[1.5] text-[#2b2747]">
              {c.pullQuote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutTriJourney({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    intro: string;
    items: { period: string; title: string; org: string; body: string }[];
  };
  return (
    <section className="shell section-y">
      <Eyebrow color="#024794" className="mb-3.5">
        {c.eyebrow}
      </Eyebrow>
      <h2 className="mb-2 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <p className="mb-[46px] max-w-[42em] text-[17px] leading-[1.55] text-muted">{c.intro}</p>
      <div className="grid gap-0">
        {c.items.map((it, i) => {
          const color = ACCENTS[i % ACCENTS.length];
          const last = i === c.items.length - 1;
          return (
            <div key={i} className="grid gap-x-6 gap-y-2 sm:grid-cols-[168px_1fr]">
              <div className="pt-1">
                <div className="font-display text-[15px] font-medium" style={{ color }}>
                  {it.period}
                </div>
              </div>
              <div className="relative pb-9 pl-7 sm:pl-8">
                {/* rail + node */}
                <span
                  className="absolute left-0 top-[7px] h-3.5 w-3.5 rounded-full ring-4 ring-white"
                  style={{ background: color }}
                />
                {!last && <span className="absolute left-[6px] top-[7px] h-full w-px bg-hair-1" />}
                <h3 className="text-[19px] leading-tight text-ink">{it.title}</h3>
                <div className="mt-[3px] text-[13px] font-semibold text-indigo">{it.org}</div>
                <p className="mt-2.5 max-w-[42em] text-[15px] leading-[1.6] text-[#62657a]">{it.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AboutTriApproach({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    intro: string;
    items: { eyebrow: string; title: string; body: string }[];
  };
  return (
    <div className="border-t border-[#eef0f5] bg-[#f8f9fc]">
      <div className="shell py-[clamp(56px,7vw,92px)]">
        <div className="mb-[42px] max-w-[40em]">
          <Eyebrow className="mb-3.5">{c.eyebrow}</Eyebrow>
          <h2 className="mb-3 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
            {c.headingLead} <em className="italic text-eq">{c.headingEmphasis}</em>
          </h2>
          <p className="text-[17px] leading-[1.55] text-muted">{c.intro}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {c.items.map((m, i) => (
            <div key={m.title} className="lift rounded-[14px] border border-hair-2 bg-white p-[26px]">
              <span
                className="mb-4 inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: ACCENTS[i % ACCENTS.length] }}
              />
              <div className="label-caps mb-2" style={{ color: ACCENTS[i % ACCENTS.length] }}>
                {m.eyebrow}
              </div>
              <h3 className="mb-2 text-[20px] text-ink">{m.title}</h3>
              <p className="text-[14.5px] leading-[1.55] text-[#62657a]">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutTriCredentials({ content }: { content: SC }) {
  const c = content as {
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    educationTitle: string;
    education: { degree: string; detail: string }[];
    certificationsTitle: string;
    certifications: { name: string; detail: string }[];
    sectorsTitle: string;
    sectors: { text: string }[];
  };
  return (
    <section className="shell section-y">
      <Eyebrow color="#024794" className="mb-3.5">
        {c.eyebrow}
      </Eyebrow>
      <h2 className="mb-[42px] max-w-[16em] text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
        {c.headingLead} <em className="italic text-mq">{c.headingEmphasis}</em>
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
          <div className="label-caps mb-4">{c.educationTitle}</div>
          <ul className="grid gap-4">
            {c.education.map((e, i) => (
              <li key={i}>
                <div className="font-display text-[16.5px] leading-snug text-ink">{e.degree}</div>
                <div className="mt-[3px] text-[13px] leading-snug text-muted-2">{e.detail}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
          <div className="label-caps mb-4">{c.certificationsTitle}</div>
          <ul className="grid gap-4">
            {c.certifications.map((e, i) => (
              <li key={i}>
                <div className="font-display text-[16.5px] leading-snug text-ink">{e.name}</div>
                <div className="mt-[3px] text-[13px] leading-snug text-muted-2">{e.detail}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
          <div className="label-caps mb-4">{c.sectorsTitle}</div>
          <div className="flex flex-wrap gap-2">
            {c.sectors.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-hair-1 bg-soft-1 px-3 py-1.5 text-[13px] font-medium text-[#4c5066]"
              >
                {s.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutTriCta({ content }: { content: SC }) {
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
