import { Link } from "wouter";
import { LandingNav } from "@/components/marketing/landing-nav";
import { FAQ } from "@/components/marketing/faq";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";

const CHALLENGES = [
  ["01", "Relentless pace", "Rapid change and pressure leave no room to lead deliberately."],
  ["02", "Execution drift", "Small misalignments and unclear expectations quietly erode results."],
  ["03", "Hard conversations", "Avoided or “winged” — the moments that matter most go unhandled."],
  ["04", "Isolation at the top", "Leading alone, with no place to think clearly or be challenged well."],
];

const STEPS = [
  ["Step 01", "Take the assessment", "A 4-minute leadership diagnostic. We learn exactly where you're stretched today."],
  ["Step 02", "Join the cohort", "Get matched into the Fall 2026 cohort with your workbook and live weekly sessions."],
  ["Step 03", "Lead differently", "Six months later, lead from a grounded place — and grow the leaders around you."],
];

const METHOD = [
  { eyebrow: "EQ · EMOTIONAL", title: "Build the Leader", body: "Self-awareness and self-trust. Lead from a steady, grounded place.", bg: "#024794", sub: "#d4e0f4" },
  { eyebrow: "IQ · INTELLECTUAL", title: "Build the Team", body: "Trust, accountability, and execution that holds through people.", bg: "#262161", sub: "#cfd2ea" },
  { eyebrow: "MQ™ · MENTORSHIP", title: "Build Future Leaders", body: "Mentor and grow the next generation. An employee-centered culture.", bg: "#662d91", sub: "#e4d3ef" },
];

const OUTCOMES = [
  ["selfdiscovery.png", "Lead from a grounded place", "Steadier under pressure, with deeper self-trust."],
  ["harmony.png", "Hard conversations, with ease", "Prepare and hold them with confidence and intention."],
  ["trust.png", "Trust, both ways", "Increase self-trust and trust with the people you lead."],
  ["inspire.png", "Accountability & engagement", "Raise ownership across the team — without chasing."],
  ["buildtrust.png", "Stronger relationships", "Connect and build a culture people want to work in."],
  ["grit.png", "Mentor the next generation", "Develop your potentials and grow future leaders."],
];

const GLANCE = [
  ["Duration", "Aug 2026 – Feb 2027", "Six months"],
  ["Sessions", "Thursdays, 9–11 PST", "Live virtual · weekly"],
  ["Coaching", "2 private 1:1s", "+ physical workbook shipped"],
  ["Format", "Cohort · limited seats", "Session 1 · intersession · Session 2"],
];

const STORIES = [
  ["It has made a more compassionate and visionary mentor out of me — and fueled growth in all spheres of my life.", "B. Hatchel", "Supervisor, American Airlines"],
  ["I witnessed remarkable enhancements in conflict resolution — both at work and in my personal life.", "J. DeLeon", "Quality Director, Earthlab Botanicals"],
  ["Tri has a unique ability to truly listen, then ask the right questions to help me find the right solution.", "J. Fisher", "CEO, Capital Financial Consultants Group"],
];

export default function LandingPage() {
  return (
    <div className="bg-white text-ink">
      <LandingNav />

      {/* Hero */}
      <section className="shell grid items-center gap-[clamp(28px,5vw,60px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <Eyebrow color="#662d91" rule className="mb-[22px]">
            An Invitation · Fall 2026 Cohort
          </Eyebrow>
          <h1 className="mb-5 text-[clamp(38px,5vw,58px)] leading-[1.04] text-ink">
            Grow into your best as a leader —<br />
            and become a leader <em className="italic text-eq">worth following.</em>
          </h1>
          <p className="mb-[30px] max-w-[30em] text-[18px] leading-[1.55] text-[#4c5066]">
            The workplace asks more of you than answers — faster pace, more complexity, higher
            stakes. TLC is a practical leadership operating system that builds the clarity, trust,
            and accountability so execution holds <em className="italic text-indigo">through</em>{" "}
            your people, not around them.
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-3.5">
            <Button asChild size="lg">
              <Link href="/assessment">Start the Leadership Assessment →</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book-a-call">Book a 15-min call</Link>
            </Button>
          </div>
          <div className="text-[13px] font-medium leading-[1.5] text-[#8a8fa3]">
            Free · 4 minutes · no card required
          </div>
        </div>
        <div className="relative">
          <img
            src="/brand/tri_T.png"
            alt="Forest canopy"
            width={900}
            height={1100}
            className="block w-full rounded-[18px] shadow-hero"
          />
          <div className="absolute -left-4 bottom-6 flex items-center gap-4 rounded-[14px] bg-white px-[18px] py-4 shadow-float">
            <Stat value="6 mo" label="PROGRAM" color="#024794" />
            <span className="h-[34px] w-px bg-[#ececf2]" />
            <Stat value="Thu" label="9–11 PST" color="#262161" />
            <span className="h-[34px] w-px bg-[#ececf2]" />
            <Stat value="EQ·IQ·MQ" label="METHOD" color="#662d91" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="border-y border-[#eef0f5] bg-[#fafbfd]">
        <div className="shell flex flex-wrap items-center gap-4 py-4">
          <span className="text-[11.5px] font-semibold uppercase tracking-[.13em] text-muted-3">
            For advancing leaders to C-Suite
          </span>
          <span className="text-[#dfe2ec]">·</span>
          <span className="min-w-[260px] flex-1 font-display text-[15px] italic leading-snug text-[#3c3c52]">
            “TLC taught me to lead in my own way — more confident and more effective with my team.”
          </span>
          <span className="text-[12px] font-semibold text-muted-2">S. Manii, CEO</span>
        </div>
      </div>

      {/* Problem */}
      <section id="why" className="shell section-y">
        <Eyebrow className="mb-3.5">The challenge</Eyebrow>
        <h2 className="mb-2 max-w-[16em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
          The role changed. <em className="italic text-mq">The playbook didn't.</em>
        </h2>
        <p className="mb-10 max-w-[40em] text-[17px] leading-[1.55] text-muted">
          The world does not slow down for leaders. Most were promoted for being excellent at the
          work — then handed a role that asks for something else entirely.
        </p>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {CHALLENGES.map(([n, title, body]) => (
            <div key={n}>
              <div className="mb-3 font-display text-[15px] text-[#c3c6d4]">{n}</div>
              <h4 className="mb-[7px] text-[18px] text-indigo">{title}</h4>
              <p className="text-[14px] leading-[1.5] text-[#62657a]">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-[42px] rounded-[14px] border-l-[3px] border-mq bg-[#f6f4fb] px-[30px] py-[26px]">
          <p className="max-w-[34em] font-display text-[19px] italic leading-[1.5] text-[#2b2747]">
            “Poor leadership doesn't show up on a P&amp;L. It shows up at your employees' dinner
            table.” Leadership today isn't about having the answers — it's about creating clarity,
            trust, and momentum through others.
          </p>
        </div>
      </section>

      {/* Promise stats */}
      <div className="bg-[linear-gradient(160deg,#262161,#1b1942_60%,#024794)] text-white">
        <div className="shell grid items-center gap-6 py-[clamp(46px,5vw,68px)] md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Eyebrow color="#a9b8e0" className="mb-3">
              The promise
            </Eyebrow>
            <h3 className="text-[25px] leading-[1.18] text-white">
              Six months from pressure to a clear, grounded way of leading.
            </h3>
          </div>
          <PromiseStat value="6" label="months · weekly live sessions" />
          <PromiseStat value="2×" label="private 1:1 coaching sessions" />
          <PromiseStat value="1" label="cohort · limited seating" valueColor="#b8d8e6" />
        </div>
      </div>

      {/* Meet the guide */}
      <section id="guide" className="shell section-y grid items-center gap-[clamp(28px,5vw,56px)] lg:grid-cols-[.9fr_1.1fr]">
        <img
          src="/brand/mq_E.png"
          alt="Tri T. Nguyen coaching"
          width={900}
          height={1000}
          className="w-full rounded-[18px] shadow-[0_20px_50px_rgba(26,24,48,.16)]"
        />
        <div>
          <Eyebrow color="#024794" className="mb-3.5">
            Your guide
          </Eyebrow>
          <h2 className="mb-2 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
            Meet Tri T. Nguyen, <em className="italic text-mq">MA, PCC</em>
          </h2>
          <p className="mb-[18px] text-[14px] font-medium leading-snug text-muted-3">
            Founder, The Wisdom Tri · “Tree Win”
          </p>
          <p className="mb-3.5 text-[16.5px] leading-[1.6] text-[#4c5066]">
            For more than 30 years, Tri has worked with leaders as an HR executive, a business and
            leadership coach, and chair of CEO peer-advisory boards — from founder-led businesses to
            publicly traded companies.
          </p>
          <p className="mb-6 text-[16.5px] leading-[1.6] text-[#4c5066]">
            Sitting in all three seats taught her one lesson from every angle:{" "}
            <em className="italic text-indigo">how a person leads impacts far more than the numbers.</em>{" "}
            Lead well, and the ripple reaches people's homes.
          </p>
          <Button asChild variant="outline">
            <Link href="/book-a-call">Get to know Tri →</Link>
          </Button>
        </div>
      </section>

      {/* The plan */}
      <div id="program" className="border-t border-[#eef0f5] bg-[#f8f9fc]">
        <div className="shell py-[clamp(56px,7vw,92px)]">
          <div className="mb-[46px] text-center">
            <Eyebrow className="mb-3.5 justify-center">The plan</Eyebrow>
            <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
              Three steps. <em className="italic text-eq">One clear path.</em>
            </h2>
          </div>
          <div className="mb-[54px] grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map(([step, title, body]) => (
              <div key={step} className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
                <div className="mb-3.5 font-display text-[14px] text-eq">{step}</div>
                <h4 className="mb-2 text-[20px] text-ink">{title}</h4>
                <p className="text-[14.5px] leading-[1.55] text-[#62657a]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mb-[30px] text-center">
            <h3 className="text-[23px] text-ink">
              Built on the <em className="italic text-mq">MQ™</em> method — EQ · IQ · MQ™
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
            {METHOD.map((m) => (
              <div
                key={m.title}
                className="lift rounded-[16px] p-[26px] text-white"
                style={{ background: m.bg }}
              >
                <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-label opacity-85">
                  {m.eyebrow}
                </div>
                <h4 className="mb-2.5 text-[24px] text-white">{m.title}</h4>
                <p className="text-[14px] leading-[1.55]" style={{ color: m.sub }}>
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What changes */}
      <section className="shell section-y">
        <Eyebrow color="#024794" className="mb-3.5">
          What changes
        </Eyebrow>
        <h2 className="mb-[42px] max-w-[14em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
          The leader you become <em className="italic text-mq">— and the people who feel it.</em>
        </h2>
        <div className="grid grid-cols-1 gap-x-[26px] gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map(([icon, title, body]) => (
            <div key={title} className="flex gap-3.5">
              <img src={`/brand/${icon}`} alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
              <div>
                <h4 className="mb-1 text-[17px] text-ink">{title}</h4>
                <p className="text-[14px] leading-[1.5] text-[#62657a]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* At a glance */}
      <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
        <div className="shell py-[clamp(48px,6vw,76px)]">
          <Eyebrow className="mb-[18px]">The program at a glance</Eyebrow>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-hair-1 bg-hair-1 sm:grid-cols-2 lg:grid-cols-4">
            {GLANCE.map(([label, value, sub]) => (
              <div key={label} className="bg-white p-[22px]">
                <div className="label-caps mb-[9px]">{label}</div>
                <div className="font-display text-[19px] leading-tight text-ink">{value}</div>
                <div className="mt-[5px] text-[13px] leading-snug text-muted-2">{sub}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-muted-2">
            Investment: <span className="font-semibold text-ink">$5,500</span> · seats are limited.
          </p>
        </div>
      </div>

      {/* Stories */}
      <section id="stories" className="shell section-y">
        <Eyebrow color="#024794" className="mb-3.5">
          Stories
        </Eyebrow>
        <h2 className="mb-[42px] text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
          Leaders who answered the call.
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STORIES.map(([quote, name, role]) => (
            <div key={name} className="rounded-[14px] border border-hair-2 p-[26px]">
              <p className="mb-5 font-display text-[17px] italic leading-[1.5] text-[#2b2747]">“{quote}”</p>
              <div className="text-[14px] font-semibold text-indigo">{name}</div>
              <div className="mt-[3px] text-[12.5px] leading-snug text-muted-3">{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA + FAQ */}
      <div className="bg-[linear-gradient(160deg,#1b1942,#262161_55%,#024794)] text-white">
        <div className="shell grid items-start gap-[clamp(30px,5vw,64px)] py-[clamp(56px,7vw,92px)] lg:grid-cols-2">
          <div>
            <Eyebrow color="#b8d8e6" className="mb-4">
              Your invitation
            </Eyebrow>
            <h2 className="mb-[18px] text-[clamp(30px,3.6vw,44px)] leading-[1.06] text-white">
              Here's to <em className="italic text-sky">answering the call.</em>
            </h2>
            <p className="mb-[30px] max-w-[26em] text-[17px] leading-[1.55] text-[#cdd6ee]">
              The Fall 2026 cohort is opening a limited number of seats. Start with the 4-minute
              assessment — and see exactly how TLC meets you where you are.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Button asChild size="lg" variant="light" className="font-bold">
                <Link href="/assessment">Start the Assessment →</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/book-a-call">Book a call with Tri</Link>
              </Button>
            </div>
          </div>
          <FAQ />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#eef0f5] bg-white">
        <div className="shell flex flex-wrap items-center gap-3.5 py-[34px]">
          <img src="/brand/wisdomtri-logo.jpg" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
          <span className="text-[14px] font-semibold text-indigo">The Wisdom Tri</span>
          <span className="ml-auto text-[13px] leading-[1.5] text-muted-2">
            thewisdomtri.com&nbsp;·&nbsp;tri.nguyen@thewisdomtri.com
          </span>
          <span className="w-full text-left text-[13px] leading-[1.5] text-[#b3b7c6]">
            © 2026 The Wisdom Tri · Do Good While Doing Well.
          </span>
        </div>
      </footer>
    </div>
  );
}

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

function PromiseStat({
  value,
  label,
  valueColor = "#fff",
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="font-display text-[38px] leading-none" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-[#b8c6e8]">{label}</div>
    </div>
  );
}
