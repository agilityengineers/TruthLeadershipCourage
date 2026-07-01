import { Link } from "wouter";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LeadershipModel } from "@/components/marketing/leadership-model";
import { Eyebrow } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";

const WHAT_CHANGES: [string, string][] = [
  ["Execution tightens.", "Faster, clearer decisions. Less rework and friction. Alignment that holds without you chasing it."],
  ["Accountability becomes the norm.", "Commitments owned and followed through across teams — not just where you're watching."],
  ["Your bench gets deeper.", "Leaders actively grow the next generation, so you have successors, not gaps. The mark of a great leader is the leaders they raise."],
  ["Your culture strengthens.", "People feel valued and part of something. Engagement rises, and the place stays worth working for as it grows."],
  ["Your best people stay.", "You keep the leaders you'd hate to lose — and avoid the hard and soft costs of turnover."],
];

const HOW = [
  "How they decide under pressure",
  "How they build trust and hold accountability",
  "How they grow the leaders beneath them",
  "Who they become when no one's coaching them",
  "Who your company becomes for the people inside it",
];

const RETURN = [
  "Leaders who hold under pressure, consistently",
  "Teams that align and execute",
  "A bench deep enough to scale",
  "A culture that attracts and keeps talent",
  "Results that show up financially, and humanly",
];

const FOR_ORGS = [
  "Know more training alone won't fix it",
  "Are ready to grow their people, not just their headcount",
  "Want to build something that matters, not just something that scales",
];

export default function OrganizationsPage() {
  return (
    <div className="bg-white text-ink">
      <LandingNav />

      {/* Hero */}
      <section className="shell grid items-center gap-[clamp(28px,5vw,60px)] py-[clamp(40px,6vw,76px)] pb-10 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <Eyebrow color="#024794" rule className="mb-[22px]">
            TLC for Organizations
          </Eyebrow>
          <h1 className="mb-5 text-[clamp(36px,4.6vw,54px)] leading-[1.05] text-ink">
            Transform your leaders.{" "}
            <em className="italic text-eq">Transform your company.</em>
          </h1>
          <p className="mb-[30px] max-w-[32em] text-[18px] leading-[1.55] text-[#4c5066]">
            You can scale without losing the soul of the place — but most of what stalls a growing
            company traces back to one thing: how your people are led. TLC builds leaders worth
            following, at every level,{" "}
            <em className="italic text-indigo">so your company executes like one.</em>
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-3.5">
            <Button asChild size="lg">
              <Link href="/book-a-call">Get Started →</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Exploring for yourself? TLC for Leaders</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <img
            src="/brand/tri_T.png"
            alt="Leadership team"
            width={900}
            height={1100}
            className="block w-full rounded-[18px] shadow-hero"
          />
          <div className="absolute -left-4 bottom-6 flex items-center gap-4 rounded-[14px] bg-white px-[18px] py-4 shadow-float">
            <Stat value="Every" label="LEVEL" color="#024794" />
            <span className="h-[34px] w-px bg-[#ececf2]" />
            <Stat value="Private" label="COHORT" color="#262161" />
            <span className="h-[34px] w-px bg-[#ececf2]" />
            <Stat value="EQ·IQ·MQ" label="METHOD" color="#662d91" />
          </div>
        </div>
      </section>

      {/* The execution problem */}
      <section className="shell section-y">
        <Eyebrow className="mb-3.5">The execution problem</Eyebrow>
        <h2 className="mb-2 max-w-[18em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
          How your team performs is a reflection of{" "}
          <em className="italic text-mq">how they are being led.</em>
        </h2>
        <p className="mb-10 max-w-[42em] text-[17px] leading-[1.55] text-muted">
          When leadership is inconsistent, execution is inconsistent. Most of your managers were
          promoted for what they do, not how they lead — so under pressure they fall back on
          instinct, and leadership varies from manager to manager. It rarely shows up as one big
          failure. It shows up as a hundred small ones, quarter after quarter.
        </p>
        <div className="rounded-[14px] border-l-[3px] border-mq bg-[#f6f4fb] px-[30px] py-[26px]">
          <p className="max-w-[36em] font-display text-[19px] italic leading-[1.5] text-[#2b2747]">
            “The way your employees perform is a reflection of how they are being led.” When every
            leader works to the same standard, accountability stops being a personality trait and
            starts being a culture.
          </p>
        </div>
      </section>

      {/* The formula + model */}
      <div className="border-t border-[#eef0f5] bg-[#f8f9fc]">
        <div className="shell py-[clamp(56px,7vw,92px)]">
          <div className="mb-[34px] text-center">
            <Eyebrow color="#024794" className="mb-3.5 justify-center">
              The formula
            </Eyebrow>
            <h2 className="text-[clamp(26px,3.2vw,38px)] leading-[1.12] text-ink">
              One operating system, <em className="italic text-mq">shared by every leader.</em>
            </h2>
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
              <p className="mb-3.5 text-[16px] leading-[1.6] text-[#4c5066]">
                Tools alone fade under pressure. The 77% that decides how a leader shows up when it
                counts is who they are underneath the tools — and that inner work is what no tactic
                alone can produce: resilience, and leadership that stays steady.
              </p>
              <p className="text-[16px] leading-[1.6] text-[#4c5066]">
                TLC builds both. And when an entire team shares the same operating system, leadership
                stops varying by manager and becomes simply{" "}
                <em className="italic text-indigo">how your company works.</em>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why it scales */}
      <div className="bg-[linear-gradient(160deg,#262161,#1b1942_60%,#024794)] text-white">
        <div className="shell grid items-center gap-6 py-[clamp(46px,5vw,68px)] md:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow color="#a9b8e0" className="mb-3">
              Why it scales
            </Eyebrow>
            <h3 className="text-[clamp(23px,2.6vw,30px)] leading-[1.18] text-white">
              Consistency, not just capability, is what drives results.
            </h3>
          </div>
          <p className="text-[16px] leading-[1.6] text-[#cdd6ee]">
            A typical program adds tools that depend on each leader to apply them, so leadership
            still varies and fades under pressure. TLC builds a shared way of leading — one
            operating system — that works in real moments, not just training settings, and scales
            across the organization.
          </p>
        </div>
      </div>

      {/* What changes */}
      <section className="shell section-y">
        <Eyebrow color="#024794" className="mb-3.5">
          What changes
        </Eyebrow>
        <h2 className="mb-[42px] max-w-[18em] text-[clamp(28px,3.4vw,40px)] leading-[1.1] text-ink">
          When your team leads <em className="italic text-mq">from the same place.</em>
        </h2>
        <div className="grid grid-cols-1 gap-x-[26px] gap-y-6 sm:grid-cols-2">
          {WHAT_CHANGES.map(([title, body]) => (
            <div key={title} className="flex gap-3.5">
              <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-eq" />
              <div>
                <h4 className="mb-1 text-[17px] text-ink">{title}</h4>
                <p className="text-[14.5px] leading-[1.55] text-[#62657a]">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[42px] rounded-[14px] border border-hair-2 p-[26px]">
          <p className="font-display text-[17px] italic leading-[1.5] text-[#2b2747]">
            “This program is beneficial not just for leadership, but for the whole team.”
          </p>
          <div className="mt-3 text-[13px] font-semibold text-indigo">
            Joseph F. <span className="font-medium text-muted-3">· Client Services Manager</span>
          </div>
        </div>
      </section>

      {/* The TLC difference */}
      <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
        <div className="shell py-[clamp(48px,6vw,76px)]">
          <Eyebrow className="mb-3.5">The TLC difference</Eyebrow>
          <h2 className="mb-[36px] max-w-[20em] text-[clamp(26px,3vw,36px)] leading-[1.12] text-ink">
            Most systems focus on what your leaders do.{" "}
            <em className="italic text-mq">TLC works on the who and the how.</em>
          </h2>
          <div className="grid grid-cols-1 gap-[26px] md:grid-cols-3">
            <DiffColumn title="The how" items={HOW} color="#024794" />
            <DiffColumn title="The return" items={RETURN} color="#262161" />
            <DiffColumn title="Built for organizations that" items={FOR_ORGS} color="#662d91" />
          </div>
        </div>
      </div>

      {/* Built for your team */}
      <section className="shell section-y grid items-center gap-[clamp(28px,5vw,56px)] lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <Eyebrow color="#024794" className="mb-3.5">
            Built for your team
          </Eyebrow>
          <h2 className="mb-3.5 text-[clamp(27px,3.2vw,38px)] leading-[1.1] text-ink">
            Built for your team, <em className="italic text-mq">and only your team.</em>
          </h2>
          <p className="mb-3.5 text-[16.5px] leading-[1.6] text-[#4c5066]">
            At its core, TLC is a six-month leadership operating system: live virtual sessions, two
            hours a week, that build the leader, then the team, then the next generation of leaders.
          </p>
          <p className="text-[16.5px] leading-[1.6] text-[#4c5066]">
            For your organization, that core comes as a private cohort — just your leaders, in a room
            that's yours. Because no two businesses are the same, we tailor the structure to your
            goals, your challenges, and where your leadership most needs to grow.{" "}
            <em className="italic text-indigo">The foundation stays the same. The path is shaped around you.</em>
          </p>
        </div>
        <div className="rounded-[16px] border border-hair-2 bg-white p-[28px] shadow-card">
          <div className="label-caps mb-4">The engagement</div>
          <ul className="grid gap-3.5">
            {[
              ["Six months", "Session 1 · intersession · Session 2"],
              ["Two hours a week", "Live virtual · your leaders only"],
              ["Tailored", "Structure shaped to your goals"],
              ["Private cohort", "No sitting beside strangers"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-baseline justify-between gap-4 border-b border-hair-2 pb-3 last:border-0 last:pb-0">
                <span className="font-display text-[16px] text-ink">{k}</span>
                <span className="text-right text-[13px] leading-snug text-muted-2">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proof */}
      <div className="border-y border-[#eef0f5] bg-[#f8f9fc]">
        <div className="shell py-[clamp(48px,6vw,76px)]">
          <Eyebrow color="#024794" className="mb-[26px]">
            From the culture to the P&amp;L
          </Eyebrow>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Quote
              text="After putting my entire leadership team through TLC, I've witnessed a genuine transformation in my business. Conflicts are addressed directly, and mistakes are caught or prevented earlier. We've significantly reduced turnover."
              name="R. Williams"
              role="CEO"
            />
            <Quote
              text="I used to over-function, which capped accountability across the team. Now I lead with clarity and intention. We cut cycle time by 45%, with stronger accountability and a better customer experience."
              name="E. Sandoval"
              role="CEO"
            />
          </div>
        </div>
      </div>

      {/* Get started */}
      <div className="bg-[linear-gradient(160deg,#1b1942,#262161_55%,#024794)] text-white">
        <div className="shell py-[clamp(56px,7vw,92px)]">
          <div className="max-w-[34em]">
            <Eyebrow color="#b8d8e6" className="mb-4">
              Get started
            </Eyebrow>
            <h2 className="mb-[18px] text-[clamp(30px,3.6vw,44px)] leading-[1.06] text-white">
              Build the company you <em className="italic text-sky">set out to build.</em>
            </h2>
            <p className="mb-[30px] text-[17px] leading-[1.55] text-[#cdd6ee]">
              Tell me about your team. We'll talk through where execution is drifting, what you want
              your leadership culture to become, and whether TLC is the right fit. Organization
              pricing is tailored to your team and scope.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Button asChild size="lg" variant="light" className="font-bold">
                <Link href="/book-a-call">Get Started →</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/">Exploring for yourself? TLC for Leaders</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#eef0f5] bg-white">
        <div className="shell flex flex-wrap items-center gap-3.5 py-[34px]">
          <img src="/brand/wisdomtri-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="text-[14px] font-semibold text-indigo">The Wisdom Tri</span>
          <Link href="/" className="text-[13px] font-semibold text-eq hover:underline">
            ← TLC for Leaders
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
      <div className="font-display text-[20px] leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-[3px] text-[10px] font-medium leading-snug tracking-[.04em] text-[#8a8fa3]">
        {label}
      </div>
    </div>
  );
}

function DiffColumn({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="rounded-[14px] border border-hair-2 bg-white p-[26px]">
      <div className="label-caps mb-4" style={{ color }}>
        {title}
      </div>
      <ul className="grid gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[14.5px] leading-[1.5] text-[#4c5066]">
            <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
            {item}
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
