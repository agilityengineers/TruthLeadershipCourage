import { z } from "zod";

/**
 * Site-content registry — the single source of truth for every admin-editable
 * marketing section. Pure data + Zod validation; no DB or framework imports, so
 * it is safe to use from the seed (`@workspace/db`) and the API server.
 *
 * For each section we declare a stable `key`, the `page` it renders on, an
 * admin-friendly `label`/`description`, the editable `fields` (drive the admin
 * form generator AND derive a Zod schema), and the `default` content (lifted
 * verbatim from the original marketing pages). The public site merges stored
 * content over these defaults and validates; a bad edit always falls back to the
 * default, so the site can never break from an edit.
 */

// ───────────────────────────── Field descriptor DSL ─────────────────────────

export type FieldDef =
  | { kind: "text"; name: string; label: string; help?: string }
  | { kind: "textarea"; name: string; label: string; help?: string }
  | { kind: "url"; name: string; label: string; help?: string }
  | { kind: "image"; name: string; label: string; help?: string } // { src, alt }
  | { kind: "link"; name: string; label: string; help?: string } // { label, href }
  | {
      kind: "list";
      name: string;
      label: string;
      help?: string;
      itemLabel: string;
      item: FieldDef[];
    };

export type SectionGroup =
  | "Global"
  | "Home page"
  | "Organizations page"
  | "About Tri page"
  | "Other pages";

export interface SectionDef {
  key: string;
  page: string; // which public surface queries it ("global" = every marketing page)
  group: SectionGroup;
  label: string;
  description: string;
  order: number;
  /** Core funnel section — hiding it shows a soft warning in the admin. */
  core?: boolean;
  fields: FieldDef[];
  default: Record<string, unknown>;
}

// ───────────────────────────── Zod schema derivation ────────────────────────

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  switch (f.kind) {
    case "text":
    case "textarea":
    case "url":
      return z.string();
    case "image":
      return z.object({ src: z.string(), alt: z.string() });
    case "link":
      return z.object({ label: z.string(), href: z.string() });
    case "list":
      return z.array(objectSchema(f.item));
  }
}

function objectSchema(fields: FieldDef[]): z.ZodObject<z.ZodRawShape> {
  return z.object(Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)])));
}

/** Build a Zod schema for a section's content from its field descriptors. */
export function schemaFor(def: SectionDef): z.ZodObject<z.ZodRawShape> {
  return objectSchema(def.fields);
}

/**
 * Resolve the content to render for a section: merge stored content over the
 * registry default and validate. A null/invalid payload falls back to the
 * default, so a bad edit can never blank or break the public site. Pure.
 */
export function resolveContent(def: SectionDef, stored?: unknown): Record<string, unknown> {
  if (stored == null || typeof stored !== "object") return def.default;
  const merged = { ...def.default, ...(stored as Record<string, unknown>) };
  const parsed = schemaFor(def).safeParse(merged);
  return parsed.success ? (parsed.data as Record<string, unknown>) : def.default;
}

const linkFields = (name: string, label: string): FieldDef => ({ kind: "link", name, label });

// ───────────────────────────────── Sections ─────────────────────────────────

export const SECTIONS: SectionDef[] = [
  // ════════════════════════════════ GLOBAL ═══════════════════════════════════
  {
    key: "global.nav",
    page: "global",
    group: "Global",
    label: "Top navigation",
    description: "The logo, menu links, and call-to-action shown at the top of every marketing page.",
    order: 1,
    fields: [
      { kind: "text", name: "logoAlt", label: "Logo alt text", help: "Describes the logo for screen readers." },
      {
        kind: "list",
        name: "links",
        label: "Menu links",
        itemLabel: "link",
        item: [
          { kind: "text", name: "label", label: "Label" },
          { kind: "url", name: "href", label: "Link" },
        ],
      },
      linkFields("cta", "Primary button"),
    ],
    default: {
      logoAlt: "The Wisdom Tri",
      links: [
        { label: "TLC for Leaders", href: "/" },
        { label: "TLC for Organizations", href: "/organizations" },
        { label: "About Tri", href: "/about-tri" },
        { label: "Stories", href: "#stories" },
      ],
      cta: { label: "Upcoming Cohort Dates", href: "/cohorts" },
    },
  },
  {
    key: "global.footer",
    page: "global",
    group: "Global",
    label: "Footer",
    description:
      "Brand line, contact, and copyright shown at the bottom of every marketing page. (The contextual cross-page link is set automatically per page.)",
    order: 2,
    fields: [
      { kind: "text", name: "brandName", label: "Brand name" },
      { kind: "text", name: "contact", label: "Contact line", help: "e.g. site · email" },
      { kind: "text", name: "copyright", label: "Copyright / tagline line" },
    ],
    default: {
      brandName: "The Wisdom Tri",
      contact: "thewisdomtri.com · tri.nguyen@thewisdomtri.com",
      copyright: "© 2026 The Wisdom Tri · Do Good While Doing Well.",
    },
  },

  // ═════════════════════════════════ HOME ════════════════════════════════════
  {
    key: "home.hero",
    page: "home",
    group: "Home page",
    label: "Hero",
    description:
      "The opening banner: headline, intro, the primary call-to-action, photo, and stat chips. The next open cohort's start date is shown automatically beside the button.",
    order: 1,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow (small label above headline)" },
      { kind: "text", name: "headlineLead", label: "Headline — first part" },
      { kind: "text", name: "headlineEmphasis", label: "Headline — emphasized part (italic, colored)" },
      { kind: "textarea", name: "body", label: "Intro paragraph" },
      linkFields("primaryCta", "Primary button"),
      { kind: "text", name: "microcopy", label: "Microcopy under the button" },
      { kind: "image", name: "image", label: "Hero image" },
      {
        kind: "list",
        name: "stats",
        label: "Stat chips",
        itemLabel: "stat",
        item: [
          { kind: "text", name: "value", label: "Value" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
    ],
    default: {
      eyebrow: "An Invitation to Lead",
      headlineLead: "Become a leader",
      headlineEmphasis: "worth following.",
      body: "You've done the trainings, read the books, collected the frameworks. So why does it still come apart in the moment that matters? By one well-known measure, only about 23% of how well you lead is what you do. The other 77% is who you are — and that's the part TLC works on.",
      primaryCta: { label: "Upcoming Cohort Dates →", href: "/cohorts" },
      microcopy: "Six-month cohort · live and virtual · seats limited by design",
      image: { src: "/brand/tri_T.png", alt: "Forest canopy" },
      stats: [
        { value: "6 mo", label: "PROGRAM" },
        { value: "2 hrs", label: "WEEKLY" },
        { value: "EQ·IQ·MQ", label: "METHOD" },
      ],
    },
  },
  {
    key: "home.trustStrip",
    page: "home",
    group: "Home page",
    label: "Trust strip",
    description: "The thin band under the hero with an audience label and a one-line quote.",
    order: 2,
    fields: [
      { kind: "text", name: "label", label: "Audience label" },
      { kind: "textarea", name: "quote", label: "Quote" },
      { kind: "text", name: "attribution", label: "Attribution" },
    ],
    default: {
      label: "For advancing leaders to C-Suite",
      quote: "TLC taught me to lead in my own way — more confident and more effective with my team.",
      attribution: "S. Manii, CEO",
    },
  },
  {
    key: "home.problem",
    page: "home",
    group: "Home page",
    label: "The problem (“Why training doesn’t stick”)",
    description: "Eyebrow, heading, intro, the four challenge cards, and the pull-quote.",
    order: 3,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "body", label: "Intro paragraph" },
      {
        kind: "list",
        name: "challenges",
        label: "Challenge cards",
        itemLabel: "card",
        item: [
          { kind: "text", name: "number", label: "Number" },
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
      { kind: "textarea", name: "pullQuote", label: "Pull-quote" },
    ],
    default: {
      eyebrow: "Why training doesn't stick",
      headingLead: "New apps.",
      headingEmphasis: "Same operating system.",
      body: "You took the notes and walked out knowing exactly what a good leader does. Then a hard moment came, and almost none of it showed up. Under pressure, you don't reach for what you learned — you reach for how you think. Every tactic is an app running on something deeper: your operating system. TLC works there.",
      challenges: [
        { number: "01", title: "Relentless pace", body: "Rapid change and pressure leave no room to lead deliberately." },
        { number: "02", title: "Execution drift", body: "Small misalignments and unclear expectations quietly erode results." },
        { number: "03", title: "Hard conversations", body: "Avoided or “winged” — the moments that matter most go unhandled." },
        { number: "04", title: "Isolation at the top", body: "Leading alone, with no place to think clearly or be challenged well." },
      ],
      pullQuote:
        "“Poor leadership doesn't show up on a P&L. It shows up at your employees' dinner table.” Leadership today isn't about having the answers — it's about creating clarity, trust, and momentum through others.",
    },
  },
  {
    key: "home.promise",
    page: "home",
    group: "Home page",
    label: "The promise (stats band)",
    description: "The dark band with the promise heading and three big stats.",
    order: 4,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "textarea", name: "heading", label: "Heading" },
      {
        kind: "list",
        name: "stats",
        label: "Stats",
        itemLabel: "stat",
        item: [
          { kind: "text", name: "value", label: "Value" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
    ],
    default: {
      eyebrow: "The promise",
      heading: "Six months from pressure to a clear, grounded way of leading.",
      stats: [
        { value: "6", label: "months · weekly live sessions" },
        { value: "2×", label: "private 1:1 coaching sessions" },
        { value: "1", label: "cohort · limited seating" },
      ],
    },
  },
  {
    key: "home.guide",
    page: "home",
    group: "Home page",
    label: "Meet the guide (Tri)",
    description: "Tri's photo, bio paragraphs, role line, and the “get to know Tri” button.",
    order: 5,
    fields: [
      { kind: "image", name: "image", label: "Photo" },
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "text", name: "role", label: "Role line" },
      {
        kind: "list",
        name: "paragraphs",
        label: "Bio paragraphs",
        itemLabel: "paragraph",
        item: [{ kind: "textarea", name: "text", label: "Text" }],
      },
      linkFields("cta", "Button"),
    ],
    default: {
      image: { src: "/brand/mq_E.png", alt: "Tri T. Nguyen coaching" },
      eyebrow: "Your guide",
      headingLead: "Meet Tri T. Nguyen,",
      headingEmphasis: "MA, PCC",
      role: "Founder, The Wisdom Tri · “Tree Win”",
      paragraphs: [
        {
          text: "For more than 30 years, Tri has worked with leaders as an HR executive, a business and leadership coach, and chair of CEO peer-advisory boards — from founder-led businesses to publicly traded companies.",
        },
        {
          text: "Sitting in all three seats taught her one lesson from every angle: how a person leads impacts far more than the numbers. Lead well, and the ripple reaches people's homes.",
        },
      ],
      cta: { label: "Get to know Tri →", href: "/about-tri" },
    },
  },
  {
    key: "home.plan",
    page: "home",
    group: "Home page",
    label: "The plan & operating system",
    description:
      "The three steps, plus the EQ·IQ·MQ operating-system summary and the three pillar rows. (The circular diagram itself stays in code.)",
    order: 6,
    fields: [
      { kind: "text", name: "eyebrow", label: "Steps eyebrow" },
      { kind: "text", name: "headingLead", label: "Steps heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Steps heading — emphasized part" },
      {
        kind: "list",
        name: "steps",
        label: "Steps",
        itemLabel: "step",
        item: [
          { kind: "text", name: "step", label: "Step label" },
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
      { kind: "text", name: "osEyebrow", label: "Operating-system eyebrow" },
      { kind: "text", name: "osHeadingLead", label: "OS heading — first part" },
      { kind: "text", name: "osHeadingEmphasis", label: "OS heading — emphasized part" },
      { kind: "text", name: "summaryTop", label: "Summary card — top line" },
      { kind: "text", name: "summaryBottom", label: "Summary card — bottom line" },
      {
        kind: "list",
        name: "pillars",
        label: "Pillar rows",
        itemLabel: "pillar",
        item: [
          { kind: "text", name: "eyebrow", label: "Tag (EQ/IQ/MQ)" },
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
    ],
    default: {
      eyebrow: "The plan",
      headingLead: "Three steps.",
      headingEmphasis: "One clear path.",
      steps: [
        { step: "Step 01", title: "Take the assessment", body: "Five honest questions, two minutes. See exactly where you're stretched today." },
        { step: "Step 02", title: "Book a fit conversation", body: "We talk, leader to leader. Tri tells you honestly if TLC is the answer — or if something else fits better." },
        { step: "Step 03", title: "Begin with your cohort", body: "Six months later, lead from a grounded place — and grow the leaders around you." },
      ],
      osEyebrow: "The operating system",
      osHeadingLead: "Three intelligences.",
      osHeadingEmphasis: "One operating system.",
      summaryTop: "Build the Leader + Build the Team + Build Future Leaders",
      summaryBottom: "= consistency that scales, and a culture that compounds",
      pillars: [
        { eyebrow: "EQ", title: "Build the Leader", body: "The inner foundation. Self-awareness and the steadiness to lead from your best self under pressure." },
        { eyebrow: "IQ", title: "Build the Team", body: "Clarity, trust, accountability, and hard conversations handled with care. Because the relationship is the leadership." },
        { eyebrow: "MQ™", title: "Build Future Leaders", body: "Seeing potential before people see it in themselves, and growing leaders beyond you. The mark of a great leader is the leaders they raise." },
      ],
    },
  },
  {
    key: "home.outcomes",
    page: "home",
    group: "Home page",
    label: "What changes (outcomes)",
    description: "The six outcome cards with icons.",
    order: 7,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      {
        kind: "list",
        name: "items",
        label: "Outcome cards",
        itemLabel: "outcome",
        item: [
          { kind: "image", name: "icon", label: "Icon" },
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
    ],
    default: {
      eyebrow: "What changes",
      headingLead: "The leader you become,",
      headingEmphasis: "and the people who feel it.",
      items: [
        { icon: { src: "/brand/selfdiscovery.png", alt: "" }, title: "Lead from a grounded place", body: "Steadier under pressure, with deeper self-trust." },
        { icon: { src: "/brand/harmony.png", alt: "" }, title: "Hard conversations, with ease", body: "Prepare and hold them with confidence and intention." },
        { icon: { src: "/brand/trust.png", alt: "" }, title: "Trust, both ways", body: "Increase self-trust and trust with the people you lead." },
        { icon: { src: "/brand/inspire.png", alt: "" }, title: "Accountability & engagement", body: "Raise ownership across the team — without chasing." },
        { icon: { src: "/brand/buildtrust.png", alt: "" }, title: "Stronger relationships", body: "Connect and build a culture people want to work in." },
        { icon: { src: "/brand/grit.png", alt: "" }, title: "Mentor the next generation", body: "Develop your potentials and grow future leaders." },
      ],
    },
  },
  {
    key: "home.glance",
    page: "home",
    group: "Home page",
    label: "Program at a glance",
    description: "The four program-fact tiles and the footnote.",
    order: 8,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      {
        kind: "list",
        name: "items",
        label: "Fact tiles",
        itemLabel: "fact",
        item: [
          { kind: "text", name: "label", label: "Label" },
          { kind: "text", name: "value", label: "Value" },
          { kind: "text", name: "sub", label: "Sub-text" },
        ],
      },
      { kind: "textarea", name: "footnote", label: "Footnote" },
    ],
    default: {
      eyebrow: "The program at a glance",
      items: [
        { label: "Duration", value: "Six months", sub: "Session 1 · intersession · Session 2" },
        { label: "Sessions", value: "Two hours a week", sub: "Live virtual · small cohort" },
        { label: "Coaching", value: "2 private 1:1s", sub: "With Tri, focused on you" },
        { label: "Investment", value: "$5,500", sub: "Seats limited by design" },
      ],
      footnote: "Check out the upcoming cohorts",
    },
  },
  {
    key: "home.stories",
    page: "home",
    group: "Home page",
    label: "Stories (testimonials)",
    description: "The three testimonial cards.",
    order: 9,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "heading", label: "Heading" },
      {
        kind: "list",
        name: "items",
        label: "Testimonials",
        itemLabel: "story",
        item: [
          { kind: "textarea", name: "quote", label: "Quote" },
          { kind: "text", name: "name", label: "Name" },
          { kind: "text", name: "role", label: "Role" },
        ],
      },
    ],
    default: {
      eyebrow: "Stories",
      heading: "Leaders who answered the call.",
      items: [
        { quote: "She helped me move past my own limiting beliefs and build a grounded, centered worldview. It's made me a better leader, mentor, spouse, and father.", name: "S. Mirsky", role: "Managing Partner" },
        { quote: "Before, we'd be more reactive. Now, with this leadership model, I stop and plan.", name: "Katie Dahmer", role: "COO" },
        { quote: "Tri's gift is to truly listen, then ask the right questions so I find the solution myself. Seven years in, the impact on my business and personal life has been remarkable.", name: "Jeff F.", role: "CEO" },
      ],
    },
  },
  {
    key: "home.whoFor",
    page: "home",
    group: "Home page",
    label: "Who this is for",
    description:
      "The honest fit check: an intro and two lists — who the program serves well, and who it isn’t the right time for.",
    order: 10,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "intro", label: "Intro paragraph" },
      { kind: "text", name: "forTitle", label: "“For you” list — title" },
      {
        kind: "list",
        name: "forItems",
        label: "“For you” list",
        itemLabel: "reason",
        item: [{ kind: "text", name: "text", label: "Reason" }],
      },
      { kind: "text", name: "notTitle", label: "“Not the right time” list — title" },
      {
        kind: "list",
        name: "notItems",
        label: "“Not the right time” list",
        itemLabel: "reason",
        item: [{ kind: "text", name: "text", label: "Reason" }],
      },
    ],
    default: {
      eyebrow: "Who this is for",
      headingLead: "Is this",
      headingEmphasis: "for you?",
      intro:
        "Built for advancing leaders through the C-Suite, whether you're stepping up or you have led for years. It has nothing to do with how senior you are. After years of this, we've learned it serves some leaders deeply and frustrates others, so let's be honest about both.",
      forTitle: "This may be for you if",
      forItems: [
        { text: "You're already accomplished, and you sense a level you haven't reached" },
        { text: "You're open to seeing that some of what made you successful is now in your way" },
        { text: "You want to lead as yourself, not a version you think you're supposed to be" },
        { text: "You care how your people leave work, not just how they perform" },
      ],
      notTitle: "This probably isn't the right time if",
      notItems: [
        { text: "You want a quick fix you can forget by Friday" },
        { text: "You'd rather not look at how you show up under pressure" },
        { text: "Honest feedback from a small group feels like too much right now" },
        { text: "You can't give it the weekly time" },
      ],
    },
  },
  {
    key: "home.finalCta",
    page: "home",
    group: "Home page",
    label: "Final call-to-action & FAQ",
    description: "The closing invitation, its two buttons, and the FAQ accordion.",
    order: 11,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "body", label: "Paragraph" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
      {
        kind: "list",
        name: "faqs",
        label: "FAQ items",
        itemLabel: "question",
        item: [
          { kind: "text", name: "q", label: "Question" },
          { kind: "textarea", name: "a", label: "Answer" },
        ],
      },
    ],
    default: {
      eyebrow: "Your invitation",
      headingLead: "Here's to",
      headingEmphasis: "answering the call.",
      body: "We're opening a limited number of seats in the next cohort. Start with the two-minute assessment — and see exactly how TLC meets you where you are.",
      primaryCta: { label: "Start the Assessment →", href: "/assessment" },
      secondaryCta: { label: "Book a call with Tri", href: "/book-a-call" },
      faqs: [
        { q: "What is the time commitment?", a: "Live virtual sessions of about two hours a week across six months — built around a working leader's schedule — plus an independent intersession and two private 1:1 coaching sessions." },
        { q: "Who is this for?", a: "Advancing leaders on the path to the C-Suite who want to lead through people — not around them. Cohorts can also be run privately for a single company's leadership team." },
        { q: "I've done leadership training before. How is this different?", a: "Most training adds tools that fade under pressure. TLC builds the leader underneath the tools — the 77% of how you show up that no tactic alone can produce — so it holds in real moments, not just in the room." },
        { q: "What happens after I start the assessment?", a: "You'll see your personalized leadership snapshot and how TLC maps to it, then a short path to book a fit conversation and, if it's a match, reserve your seat in an upcoming cohort." },
      ],
    },
  },

  // ════════════════════════════ ORGANIZATIONS ════════════════════════════════
  {
    key: "org.hero",
    page: "organizations",
    group: "Organizations page",
    label: "Hero",
    description: "Opening banner for the organizations page.",
    order: 1,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headlineLead", label: "Headline — first part" },
      { kind: "text", name: "headlineEmphasis", label: "Headline — emphasized part" },
      { kind: "textarea", name: "body", label: "Intro paragraph" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
      { kind: "image", name: "image", label: "Hero image" },
      {
        kind: "list",
        name: "stats",
        label: "Stat chips",
        itemLabel: "stat",
        item: [
          { kind: "text", name: "value", label: "Value" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
    ],
    default: {
      eyebrow: "TLC for Organizations",
      headlineLead: "Transform your leaders.",
      headlineEmphasis: "Transform your company.",
      body: "You can scale without losing the soul of the place — but most of what stalls a growing company traces back to one thing: how your people are led. TLC builds leaders worth following, at every level, so your company executes like one.",
      primaryCta: { label: "Get Started →", href: "/book-a-call" },
      secondaryCta: { label: "Exploring for yourself? TLC for Leaders", href: "/" },
      image: { src: "/brand/tri_T.png", alt: "Leadership team" },
      stats: [
        { value: "Every", label: "LEVEL" },
        { value: "Private", label: "COHORT" },
        { value: "EQ·IQ·MQ", label: "METHOD" },
      ],
    },
  },
  {
    key: "org.problem",
    page: "organizations",
    group: "Organizations page",
    label: "The execution problem",
    description: "Eyebrow, heading, paragraph, and the pull-quote.",
    order: 2,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "body", label: "Paragraph" },
      { kind: "textarea", name: "quote", label: "Pull-quote" },
    ],
    default: {
      eyebrow: "The execution problem",
      headingLead: "How your team performs is a reflection of",
      headingEmphasis: "how they are being led.",
      body: "When leadership is inconsistent, execution is inconsistent. Most of your managers were promoted for what they do, not how they lead — so under pressure they fall back on instinct, and leadership varies from manager to manager. It rarely shows up as one big failure. It shows up as a hundred small ones, quarter after quarter.",
      quote:
        "“The way your employees perform is a reflection of how they are being led.” When every leader works to the same standard, accountability stops being a personality trait and starts being a culture.",
    },
  },
  {
    key: "org.formula",
    page: "organizations",
    group: "Organizations page",
    label: "The formula",
    description: "The EQ·IQ·MQ summary card and explainer paragraphs. (The circular diagram stays in code.)",
    order: 3,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "text", name: "summaryTop", label: "Summary card — top line" },
      { kind: "text", name: "summaryBottom", label: "Summary card — bottom line" },
      {
        kind: "list",
        name: "paragraphs",
        label: "Explainer paragraphs",
        itemLabel: "paragraph",
        item: [{ kind: "textarea", name: "text", label: "Text" }],
      },
    ],
    default: {
      eyebrow: "The formula",
      headingLead: "One operating system,",
      headingEmphasis: "shared by every leader.",
      summaryTop: "Build the Leader + Build the Team + Build Future Leaders",
      summaryBottom: "= consistency that scales, and a culture that compounds",
      paragraphs: [
        { text: "Tools alone fade under pressure. The 77% that decides how a leader shows up when it counts is who they are underneath the tools — and that inner work is what no tactic alone can produce: resilience, and leadership that stays steady." },
        { text: "TLC builds both. And when an entire team shares the same operating system, leadership stops varying by manager and becomes simply how your company works." },
      ],
    },
  },
  {
    key: "org.scales",
    page: "organizations",
    group: "Organizations page",
    label: "Why it scales",
    description: "The dark band: heading and paragraph.",
    order: 4,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "textarea", name: "heading", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraph" },
    ],
    default: {
      eyebrow: "Why it scales",
      heading: "Consistency, not just capability, is what drives results.",
      body: "A typical program adds tools that depend on each leader to apply them, so leadership still varies and fades under pressure. TLC builds a shared way of leading — one operating system — that works in real moments, not just training settings, and scales across the organization.",
    },
  },
  {
    key: "org.whatChanges",
    page: "organizations",
    group: "Organizations page",
    label: "What changes",
    description: "The five change items and the closing quote.",
    order: 5,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      {
        kind: "list",
        name: "items",
        label: "Change items",
        itemLabel: "item",
        item: [
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
      { kind: "textarea", name: "quote", label: "Quote text" },
      { kind: "text", name: "quoteName", label: "Quote — name" },
      { kind: "text", name: "quoteRole", label: "Quote — role" },
    ],
    default: {
      eyebrow: "What changes",
      headingLead: "When your team leads",
      headingEmphasis: "from the same place.",
      items: [
        { title: "Execution tightens.", body: "Faster, clearer decisions. Less rework and friction. Alignment that holds without you chasing it." },
        { title: "Accountability becomes the norm.", body: "Commitments owned and followed through across teams — not just where you're watching." },
        { title: "Your bench gets deeper.", body: "Leaders actively grow the next generation, so you have successors, not gaps. The mark of a great leader is the leaders they raise." },
        { title: "Your culture strengthens.", body: "People feel valued and part of something. Engagement rises, and the place stays worth working for as it grows." },
        { title: "Your best people stay.", body: "You keep the leaders you'd hate to lose — and avoid the hard and soft costs of turnover." },
      ],
      quote: "This program is beneficial not just for leadership, but for the whole team.",
      quoteName: "Joseph F.",
      quoteRole: "Client Services Manager",
    },
  },
  {
    key: "org.difference",
    page: "organizations",
    group: "Organizations page",
    label: "The TLC difference (three columns)",
    description: "Heading and the three labelled columns of bullet points.",
    order: 6,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "text", name: "howTitle", label: "Column 1 — title" },
      {
        kind: "list",
        name: "how",
        label: "Column 1 — bullets",
        itemLabel: "bullet",
        item: [{ kind: "text", name: "text", label: "Bullet" }],
      },
      { kind: "text", name: "returnTitle", label: "Column 2 — title" },
      {
        kind: "list",
        name: "returns",
        label: "Column 2 — bullets",
        itemLabel: "bullet",
        item: [{ kind: "text", name: "text", label: "Bullet" }],
      },
      { kind: "text", name: "forOrgsTitle", label: "Column 3 — title" },
      {
        kind: "list",
        name: "forOrgs",
        label: "Column 3 — bullets",
        itemLabel: "bullet",
        item: [{ kind: "text", name: "text", label: "Bullet" }],
      },
    ],
    default: {
      eyebrow: "The TLC difference",
      headingLead: "Most systems focus on what your leaders do.",
      headingEmphasis: "TLC works on the who and the how.",
      howTitle: "The how",
      how: [
        { text: "How they decide under pressure" },
        { text: "How they build trust and hold accountability" },
        { text: "How they grow the leaders beneath them" },
        { text: "Who they become when no one's coaching them" },
        { text: "Who your company becomes for the people inside it" },
      ],
      returnTitle: "The return",
      returns: [
        { text: "Leaders who hold under pressure, consistently" },
        { text: "Teams that align and execute" },
        { text: "A bench deep enough to scale" },
        { text: "A culture that attracts and keeps talent" },
        { text: "Results that show up financially, and humanly" },
      ],
      forOrgsTitle: "Built for organizations that",
      forOrgs: [
        { text: "Know more training alone won't fix it" },
        { text: "Are ready to grow their people, not just their headcount" },
        { text: "Want to build something that matters, not just something that scales" },
      ],
    },
  },
  {
    key: "org.builtFor",
    page: "organizations",
    group: "Organizations page",
    label: "Built for your team",
    description: "Copy plus the engagement detail list.",
    order: 7,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      {
        kind: "list",
        name: "paragraphs",
        label: "Paragraphs",
        itemLabel: "paragraph",
        item: [{ kind: "textarea", name: "text", label: "Text" }],
      },
      { kind: "text", name: "engagementTitle", label: "Engagement card — title" },
      {
        kind: "list",
        name: "engagement",
        label: "Engagement rows",
        itemLabel: "row",
        item: [
          { kind: "text", name: "label", label: "Label" },
          { kind: "text", name: "value", label: "Value" },
        ],
      },
    ],
    default: {
      eyebrow: "Built for your team",
      headingLead: "Built for your team,",
      headingEmphasis: "and only your team.",
      paragraphs: [
        { text: "At its core, TLC is a six-month leadership operating system: live virtual sessions, two hours a week, that build the leader, then the team, then the next generation of leaders." },
        { text: "For your organization, that core comes as a private cohort — just your leaders, in a room that's yours. Because no two businesses are the same, we tailor the structure to your goals, your challenges, and where your leadership most needs to grow. The foundation stays the same. The path is shaped around you." },
      ],
      engagementTitle: "The engagement",
      engagement: [
        { label: "Six months", value: "Session 1 · intersession · Session 2" },
        { label: "Two hours a week", value: "Live virtual · your leaders only" },
        { label: "Tailored", value: "Structure shaped to your goals" },
        { label: "Private cohort", value: "No sitting beside strangers" },
      ],
    },
  },
  {
    key: "org.proof",
    page: "organizations",
    group: "Organizations page",
    label: "Proof (quotes)",
    description: "The two CEO quotes.",
    order: 8,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      {
        kind: "list",
        name: "quotes",
        label: "Quotes",
        itemLabel: "quote",
        item: [
          { kind: "textarea", name: "text", label: "Quote" },
          { kind: "text", name: "name", label: "Name" },
          { kind: "text", name: "role", label: "Role" },
        ],
      },
    ],
    default: {
      eyebrow: "From the culture to the P&L",
      quotes: [
        { text: "After putting my entire leadership team through TLC, I've witnessed a genuine transformation in my business. Conflicts are addressed directly, and mistakes are caught or prevented earlier. We've significantly reduced turnover.", name: "R. Williams", role: "CEO" },
        { text: "I used to over-function, which capped accountability across the team. Now I lead with clarity and intention. We cut cycle time by 45%, with stronger accountability and a better customer experience.", name: "E. Sandoval", role: "CEO" },
      ],
    },
  },
  {
    key: "org.getStarted",
    page: "organizations",
    group: "Organizations page",
    label: "Get started (call-to-action)",
    description: "The closing organizations CTA.",
    order: 9,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "body", label: "Paragraph" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
    ],
    default: {
      eyebrow: "Get started",
      headingLead: "Build the company you",
      headingEmphasis: "set out to build.",
      body: "Tell me about your team. We'll talk through where execution is drifting, what you want your leadership culture to become, and whether TLC is the right fit. Organization pricing is tailored to your team and scope.",
      primaryCta: { label: "Get Started →", href: "/book-a-call" },
      secondaryCta: { label: "Exploring for yourself? TLC for Leaders", href: "/" },
    },
  },

  // ═════════════════════════════ ABOUT TRI ════════════════════════════════════
  {
    key: "aboutTri.hero",
    page: "about-tri",
    group: "About Tri page",
    label: "Hero (“Hi, I’m Tri”)",
    description: "The opening of the bio page: portrait, greeting, pronunciation, intro paragraphs, buttons, and stat chips.",
    order: 1,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part (italic, colored)" },
      { kind: "text", name: "pronounce", label: "Pronunciation line" },
      { kind: "text", name: "role", label: "Role line" },
      {
        kind: "list",
        name: "paragraphs",
        label: "Intro paragraphs",
        itemLabel: "paragraph",
        item: [{ kind: "textarea", name: "text", label: "Text" }],
      },
      { kind: "image", name: "image", label: "Portrait" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
      {
        kind: "list",
        name: "stats",
        label: "Stat chips",
        itemLabel: "stat",
        item: [
          { kind: "text", name: "value", label: "Value" },
          { kind: "text", name: "label", label: "Label" },
        ],
      },
    ],
    default: {
      eyebrow: "Meet Your Guide",
      headingLead: "Hi, I'm",
      headingEmphasis: "Tri.",
      pronounce: "If we haven't met yet — it's pronounced “Tree Win.”",
      role: "Founder & Executive Coach, The Wisdom Tri · Vistage Chair · MA, PCC",
      paragraphs: [
        {
          text: "For more than thirty years I've worked alongside leaders from three very different seats: as a senior executive with full P&L responsibility, as a Vistage Chair guiding CEO peer-advisory boards, and — for the last decade — as an executive coach to C-level leaders in high-growth companies.",
        },
        {
          text: "Seeing leadership from all three angles taught me the same lesson over and over: how a person leads shapes far more than the numbers. I'm not here to turn you into a different leader. I'm here to help you lead from who you already are, at your best — so you become a leader worth following.",
        },
      ],
      image: { src: "/brand/mq_E.png", alt: "Tri T. Nguyen coaching two leaders" },
      primaryCta: { label: "Book a call with Tri", href: "/book-a-call" },
      secondaryCta: { label: "Start the Assessment →", href: "/assessment" },
      stats: [
        { value: "30+", label: "YEARS LEADING" },
        { value: "25 yrs", label: "IN THE C-SUITE" },
        { value: "EQ·IQ·MQ", label: "THE METHOD" },
      ],
    },
  },
  {
    key: "aboutTri.story",
    page: "about-tri",
    group: "About Tri page",
    label: "My story",
    description: "The narrative section: eyebrow, heading, story paragraphs, a pull-quote, and an atmospheric image.",
    order: 2,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      {
        kind: "list",
        name: "paragraphs",
        label: "Story paragraphs",
        itemLabel: "paragraph",
        item: [{ kind: "textarea", name: "text", label: "Text" }],
      },
      { kind: "textarea", name: "pullQuote", label: "Pull-quote" },
      { kind: "image", name: "image", label: "Atmospheric image" },
    ],
    default: {
      eyebrow: "My story",
      headingLead: "To lead others well,",
      headingEmphasis: "first lead yourself.",
      paragraphs: [
        {
          text: "Early in my career I climbed the ladder the way most of us are taught to — by getting results. I grew through progressive leadership roles at companies like Johnson & Johnson, Avon, and Fleetwood, and eventually into the C-suite as an Executive Vice President, carrying P&L responsibility and enterprise-wide oversight.",
        },
        {
          text: "I learned how to hit the numbers. What I didn't learn until much later was that the numbers were never the whole story. The teams that truly thrived weren't led by the smartest person in the room — they were led by people who knew themselves, stayed steady under pressure, and made everyone around them better.",
        },
        {
          text: "That realization sent me back to school for a master's in Applied Psychology, and then into coaching. It became my core conviction and the heart of everything I teach: to lead others effectively, you must first lead yourself. That's how you build credibility and real connection — and how you create impact that reaches past the org chart and into people's lives.",
        },
      ],
      pullQuote:
        "“To lead others effectively, one must first lead Self — building the credibility and relatability that create lasting impact across your team, your organization, and your community.”",
      image: { src: "/brand/tri_T.png", alt: "Sunlight through a forest canopy" },
    },
  },
  {
    key: "aboutTri.journey",
    page: "about-tri",
    group: "About Tri page",
    label: "The path here (timeline)",
    description: "The career journey shown as a story-style timeline of roles — not a résumé.",
    order: 3,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "intro", label: "Intro paragraph" },
      {
        kind: "list",
        name: "items",
        label: "Timeline entries",
        itemLabel: "role",
        item: [
          { kind: "text", name: "period", label: "Years" },
          { kind: "text", name: "title", label: "Role title" },
          { kind: "text", name: "org", label: "Organization" },
          { kind: "textarea", name: "body", label: "Description" },
        ],
      },
    ],
    default: {
      eyebrow: "The path here",
      headingLead: "Three seats,",
      headingEmphasis: "one throughline.",
      intro:
        "I've led from inside the business, alongside other CEOs, and across the table as a coach. Here's the road that shaped the way I work today.",
      items: [
        {
          period: "2019 – Present",
          title: "Founder & Executive Coach",
          org: "The Wisdom Tri",
          body: "My coaching practice for C-level leaders in high-growth companies, delivered virtually and in person. Here I built The Enlightened Leadership program on a simple framework — ELQ™ = EQ + IQ + MQ™ — the emotional, intellectual, and mentoring intelligences a leader needs to lead themselves, their team, and the leaders who come next.",
        },
        {
          period: "2016 – Present",
          title: "Vistage Chair",
          org: "Vistage International",
          body: "I lead CEO and C-suite peer-advisory boards, guiding accomplished leaders through their toughest calls in a room of trusted peers. Facilitating other CEOs keeps me close to the real, unscripted challenges of leading at the top.",
        },
        {
          period: "2001 – 2015",
          title: "Executive Vice President",
          org: "Bowermaster & Associates",
          body: "Fourteen years in the C-suite with full P&L responsibility, strategic-planning authority, and enterprise-wide operational oversight. Having actually carried the weight of those decisions is what lets me coach today's executives with candor instead of theory.",
        },
        {
          period: "1989 – 2001",
          title: "Progressive Leadership Roles",
          org: "Johnson & Johnson · Avon · Fleetwood",
          body: "Where it started — building the operational expertise and business acumen, one hard-won lesson at a time, across Fortune 500 and mid-market companies.",
        },
      ],
    },
  },
  {
    key: "aboutTri.approach",
    page: "about-tri",
    group: "About Tri page",
    label: "How I work (beliefs)",
    description: "The three coaching convictions shown as cards.",
    order: 4,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "intro", label: "Intro paragraph" },
      {
        kind: "list",
        name: "items",
        label: "Belief cards",
        itemLabel: "belief",
        item: [
          { kind: "text", name: "eyebrow", label: "Tag" },
          { kind: "text", name: "title", label: "Title" },
          { kind: "textarea", name: "body", label: "Body" },
        ],
      },
    ],
    default: {
      eyebrow: "How I work",
      headingLead: "The convictions",
      headingEmphasis: "I coach from.",
      intro: "Every leader I work with is different. These three beliefs shape how I show up for all of them.",
      items: [
        {
          eyebrow: "Self-leadership",
          title: "It starts with you",
          body: "Before you can lead a team, you have to lead yourself. We build the self-command that keeps you grounded when everything around you isn't.",
        },
        {
          eyebrow: "Self-awareness",
          title: "See yourself clearly",
          body: "Growth begins the moment you see how you actually land on others. I hold up an honest mirror — with enough care that you can look, and enough candor that it counts.",
        },
        {
          eyebrow: "Purpose-driven",
          title: "Lead on purpose",
          body: "The most resilient leaders are anchored to something bigger than the next quarter. We reconnect your leadership to your purpose, so it holds under pressure.",
        },
      ],
    },
  },
  {
    key: "aboutTri.credentials",
    page: "about-tri",
    group: "About Tri page",
    label: "Credentials & training",
    description: "Education, certifications, and the sectors Tri has coached in — presented cleanly, not as a résumé.",
    order: 5,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "text", name: "educationTitle", label: "Education — column title" },
      {
        kind: "list",
        name: "education",
        label: "Education",
        itemLabel: "degree",
        item: [
          { kind: "text", name: "degree", label: "Degree" },
          { kind: "text", name: "detail", label: "School & year" },
        ],
      },
      { kind: "text", name: "certificationsTitle", label: "Certifications — column title" },
      {
        kind: "list",
        name: "certifications",
        label: "Certifications",
        itemLabel: "certification",
        item: [
          { kind: "text", name: "name", label: "Credential" },
          { kind: "text", name: "detail", label: "Body & year" },
        ],
      },
      { kind: "text", name: "sectorsTitle", label: "Sectors — column title" },
      {
        kind: "list",
        name: "sectors",
        label: "Sectors",
        itemLabel: "sector",
        item: [{ kind: "text", name: "text", label: "Sector" }],
      },
    ],
    default: {
      eyebrow: "Credentials",
      headingLead: "Trained for this —",
      headingEmphasis: "on paper and in the arena.",
      educationTitle: "Education",
      education: [
        { degree: "MA, Applied Psychology", detail: "University of Santa Monica · 2012" },
        { degree: "BS, Business Administration", detail: "California Polytechnic University · 1996" },
      ],
      certificationsTitle: "Certifications",
      certifications: [
        { name: "ICF Professional Certified Coach (PCC)", detail: "International Coaching Federation · 2021" },
        { name: "iPEC Certified Professional Coach", detail: "iPEC · 2021" },
        { name: "Vistage Chair", detail: "Vistage International · since 2016" },
      ],
      sectorsTitle: "Sectors I've coached in",
      sectors: [
        { text: "Technology" },
        { text: "Construction" },
        { text: "Manufacturing" },
        { text: "Professional services" },
        { text: "Logistics" },
      ],
    },
  },
  {
    key: "aboutTri.cta",
    page: "about-tri",
    group: "About Tri page",
    label: "Closing call-to-action",
    description: "The closing invitation and its two buttons on the bio page.",
    order: 6,
    core: true,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "headingLead", label: "Heading — first part" },
      { kind: "text", name: "headingEmphasis", label: "Heading — emphasized part" },
      { kind: "textarea", name: "body", label: "Paragraph" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
    ],
    default: {
      eyebrow: "Let's talk",
      headingLead: "Let's talk about",
      headingEmphasis: "your leadership.",
      body: "Whether you're leading a team, a whole company, or figuring out your next chapter as a leader — I'd love to hear where you are. Start with the two-minute assessment, or book a 15-minute call and we'll talk, leader to leader.",
      primaryCta: { label: "Start the Assessment →", href: "/assessment" },
      secondaryCta: { label: "Book a call with Tri", href: "/book-a-call" },
    },
  },

  // ═════════════════════════════ OTHER PAGES ══════════════════════════════════
  {
    key: "bookACall.main",
    page: "book-a-call",
    group: "Other pages",
    label: "Book-a-call page",
    description: "The heading, paragraph, and buttons on the “book a call” page.",
    order: 1,
    fields: [
      { kind: "text", name: "heading", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraph" },
      linkFields("primaryCta", "Primary button"),
      linkFields("secondaryCta", "Secondary button"),
    ],
    default: {
      heading: "Let's talk about your leadership.",
      body: "Book a 15-minute fit conversation with Tri to see whether TLC is the right fit for you or your team. Most leaders start with the two-minute assessment first.",
      primaryCta: { label: "Start the Assessment →", href: "/assessment" },
      secondaryCta: { label: "Back to home", href: "/" },
    },
  },
  {
    key: "login.intro",
    page: "login",
    group: "Other pages",
    label: "Login — intro copy",
    description: "The welcome heading and sub-line above the sign-in form.",
    order: 1,
    fields: [
      { kind: "text", name: "heading", label: "Heading" },
      { kind: "text", name: "body", label: "Sub-line" },
    ],
    default: {
      heading: "Welcome back",
      body: "Sign in to your TLC portal.",
    },
  },
  {
    key: "enroll.intro",
    page: "enroll",
    group: "Other pages",
    label: "Enroll — intro & disclaimer",
    description:
      "The heading/intro above the enrollment form and the payment disclaimer below it. (The cohort list itself is data-driven.)",
    order: 1,
    fields: [
      { kind: "text", name: "heading", label: "Heading" },
      { kind: "textarea", name: "intro", label: "Intro paragraph" },
      { kind: "textarea", name: "disclaimer", label: "Payment disclaimer" },
    ],
    default: {
      heading: "Confirm your seat in the cohort",
      intro: "Choose your cohort, tell us where to ship your physical workbook, and we'll handle the rest.",
      disclaimer: "Payment is handled securely and separately — no card details are entered here.",
    },
  },
  {
    key: "cohorts.intro",
    page: "cohorts",
    group: "Other pages",
    label: "Upcoming cohorts — intro",
    description:
      "The eyebrow, heading, and intro above the list of upcoming cohorts, plus the message shown when none are open. (The cohort list itself is data-driven.)",
    order: 1,
    fields: [
      { kind: "text", name: "eyebrow", label: "Eyebrow" },
      { kind: "text", name: "heading", label: "Heading" },
      { kind: "textarea", name: "intro", label: "Intro paragraph" },
      { kind: "textarea", name: "emptyState", label: "Empty-state message" },
    ],
    default: {
      eyebrow: "Upcoming cohorts",
      heading: "Find the cohort that fits your season.",
      intro:
        "Every cohort runs six months — live, virtual, and small by design. Browse the cohorts opening next and reserve your seat while they're still enrolling.",
      emptyState:
        "No cohorts are open for enrollment right now. Book a fit conversation and we'll let you know the moment the next one opens.",
    },
  },
  {
    key: "confirmation.main",
    page: "confirmation",
    group: "Other pages",
    label: "Enrollment confirmation",
    description:
      "The confirmation messages shown after enrolling (standard and waitlisted variants) and the disclaimer.",
    order: 1,
    fields: [
      { kind: "text", name: "heading", label: "Heading (confirmed)" },
      { kind: "textarea", name: "body", label: "Message (confirmed)" },
      { kind: "text", name: "waitlistHeading", label: "Heading (waitlisted)" },
      { kind: "textarea", name: "waitlistBody", label: "Message (waitlisted)" },
      { kind: "textarea", name: "disclaimer", label: "Disclaimer" },
    ],
    default: {
      heading: "Your seat is reserved.",
      body: "Thank you for answering the call. We'll email you to confirm payment and shipping. Once payment is complete, your portal unlocks and your workbook ships before kickoff.",
      waitlistHeading: "You're on the waitlist.",
      waitlistBody: "This cohort is currently full. We'll email you the moment a seat opens — no further action needed.",
      disclaimer:
        "Payment is processed securely off-site (Stripe / ThriveCart). The TLC platform never collects card details.",
    },
  },
];

// ───────────────────────────────── Helpers ──────────────────────────────────

export const SECTION_BY_KEY: Record<string, SectionDef> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s]),
);

/** Sections that render on a given public page, sorted by order. */
export function sectionsForPage(page: string): SectionDef[] {
  return SECTIONS.filter((s) => s.page === page).sort((a, b) => a.order - b.order);
}

export const SECTION_GROUPS: SectionGroup[] = [
  "Global",
  "Home page",
  "Organizations page",
  "About Tri page",
  "Other pages",
];
