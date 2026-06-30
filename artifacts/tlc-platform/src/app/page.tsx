import { Link } from "wouter";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LeadershipModel } from "@/components/marketing/leadership-model";
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
  ["Step 01", "Take the assessment", "Five honest questions, two minutes. See exactly where you're stretched today."],
  ["Step 02", "Book a fit conversation", "We talk, leader to leader. Tri tells you honestly if TLC is the answer — or if something else fits better."],
  ["Step 03", "Begin with your cohort", "Six months later, lead from a grounded place — and grow the leaders around you."],
];

const METHOD = [
  { eyebrow: "EQ", title: "Build the Leader", body: "The inner foundation. Self-awareness and the steadiness to lead from your best self under pressure.", bg: "#024794", sub: "#d4e0f4" },
  { eyebrow: "IQ", title: "Build the Team", body: "Clarity, trust, accountability, and hard conversations handled with care. Because the relationship is the leadership.", bg: "#262161", sub: "#cfd2ea" },
  { eyebrow: "MQ™", title: "Build Future Leaders", body: "Seeing potential before people see it in themselves, and growing leaders beyond you. The mark of a great leader is the leaders they raise.", bg: "#662d91", sub: "#e4d3ef" },
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
  ["Duration", "Six months", "Session 1 · intersession · Session 2"],
  ["Sessions", "Two hours a week", "Live virtual · small cohort"],
  ["Coaching", "2 private 1:1s", "With Tri, focused on you"],
  ["Investment", "$5,500", "Seats limited by design"],
];

const STORIES = [
  ["She helped me move past my own limiting beliefs and build a grounded, centered worldview. It's made me a better leader, mentor, spouse, and father.", "S. Mirsky", "Managing Partner"],
  ["Before, we'd be more reactive. Now, with this leadership model, I stop and plan.", "Katie Dahmer", "COO"],
  ["Tri's gift is to truly listen, then ask the right questions so I find the solution myself. Seven years in, the impact on my business and personal life has been remarkable.", "Jeff F.", "CEO"],
];

export default function LandingPage() {
  return (
    <div className="bg-white text-ink">
      <LandingNav />

      {/* Hero */}
      <section className="shell grid items-center gap-[clamp(28px,5vw,60px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <Eyebrow color="#662d91" rule className="mb-[22px]">
            An Invitation to Lead
          </Eyebrow>
          <h1 className="mb-5 text-[clamp(38px,5vw,58px)] leading-[1.04] text-ink">
            Become a leader{" "}
            <em className="italic text-eq">worth following.</em>
          </h1>
          <p className="mb-[30px] max-w-[30em] text-[18px] leading-[1.55] text-[#4c5066]">
            You've done the trainings, read the books, collected the frameworks. So why does it
            still come apart in the moment that matters? By one well-known measure, only about 23%
            of how well you lead is what you <em className="italic text-indigo">do</em>. The other
            77% is who you <em className="italic text-indigo">are</em> — and that's the part TLC
            works on.
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
            Free · 2 minutes · no card required
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
            <Stat value="2 hrs" label="WEEKLY" color="#262161" />
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
        <Eyebrow className="mb-3.5">Why training doesn't stick</Eyebrow>
        <h2 className="mb-2 max-w-[16em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
          New apps. <em className="italic text-mq">Same operating system.</em>
        </h2>
        <p className="mb-10 max-w-[40em] text-[17px] leading-[1.55] text-muted">
          You took the notes and walked out knowing exactly what a good leader does. Then a hard
          moment came, and almost none of it showed up. Under pressure, you don't reach for what you
          learned — you reach for how you think. Every tactic is an app running on something deeper:
          your operating system. TLC works there.
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
          <div className="mb-[34px] text-center">
            <Eyebrow color="#024794" className="mb-3.5 justify-center">
              The operating system
            </Eyebrow>
            <h3 className="text-[clamp(24px,3vw,34px)] leading-[1.12] text-ink">
              Three intelligences. <em className="italic text-mq">One operating system.</em>
            </h3>
          </div>
          <div className="grid items-center gap-[clamp(30px,5vw,56px)] lg:grid-cols-[1fr_.92fr]">
            <LeadershipModel className="mx-auto w-full max-w-[460px]" />
            <div>
              <div className="mb-7 rounded-[16px] border border-hair-2 bg-white p-[26px] shadow-card">
                <div className="font-display text-[18px] leading-[1.42] text-ink">
                  Build the Leader <span className="text-eq">+</span> Build the Team{" "}
                  <span className="text-iq">+</span> Build Future Leaders
                </div>
                <div className="mt-2 font-display text-[18px] leading-[1.42] text-mq">
                  = consistency that scales, and a culture that compounds
                </div>
                <div className="label-caps mt-3.5">EQ + IQ + MQ™</div>
              </div>
              <div className="grid gap-[18px]">
                {METHOD.map((m) => (
                  <div key={m.title} className="flex gap-3.5">
                    <span
                      className="mt-[6px] h-3 w-3 shrink-0 rounded-full"
                      style={{ background: m.bg }}
                    />
                    <div>
                      <h4 className="mb-0.5 text-[17px] text-ink">
                        {m.title}{" "}
                        <span className="label-caps inline-block">· {m.eyebrow}</span>
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
            Next cohort dates are shared on your fit conversation — seats are limited by design.
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
              We're opening a limited number of seats in the next cohort. Start with the two-minute
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
          <img src="/brand/wisdomtri-logo.jpg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="text-[14px] font-semibold text-indigo">The Wisdom Tri</span>
          <Link href="/organizations" className="text-[13px] font-semibold text-eq hover:underline">
            Leading a team? See TLC for Organizations →
          </Link>
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
