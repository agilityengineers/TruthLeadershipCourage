/**
 * One-time, idempotent content backfill.
 *
 * The site-content registry is the source of truth for section DEFAULTS, but a
 * live database stores each section's content in a `site_section` row, and the
 * public site renders stored content merged over the default. So when we change
 * a default (e.g. drop a nav link, repoint a button, remove the Stripe line),
 * an already-seeded database keeps showing the OLD value.
 *
 * This script updates only the specific fields we intentionally changed, and
 * ONLY when the stored value still equals the previous default — so an admin's
 * own edits are never clobbered. Running it repeatedly is safe: once a field
 * holds the new value it no longer matches the old default and is skipped.
 *
 * Run with a DATABASE_URL set:  pnpm --filter @workspace/db run backfill-content
 */
import { eq } from "drizzle-orm";
import { db, pool, siteSection } from "./index";

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

const OLD = {
  navLinks: [
    { label: "TLC for Leaders", href: "/" },
    { label: "TLC for Organizations", href: "/organizations" },
    { label: "About Tri", href: "/about-tri" },
    { label: "Stories", href: "#stories" },
  ],
  aboutHeroSecondaryCta: { label: "Start the Assessment →", href: "/assessment" },
  aboutCtaPrimaryCta: { label: "Start the Assessment →", href: "/assessment" },
  aboutCtaBody:
    "Whether you're leading a team, a whole company, or figuring out your next chapter as a leader — I'd love to hear where you are. Start with the two-minute assessment, or book a 15-minute call and we'll talk, leader to leader.",
  confirmationDisclaimer:
    "Payment is processed securely off-site (Stripe / ThriveCart). The TLC platform never collects card details.",
};

const NEW = {
  navLinks: [
    { label: "TLC for Leaders", href: "/" },
    { label: "About Tri", href: "/about-tri" },
    { label: "Stories", href: "#stories" },
  ],
  aboutHeroSecondaryCta: { label: "Return to home", href: "/" },
  aboutCtaPrimaryCta: { label: "Upcoming Cohort Dates →", href: "/cohorts" },
  aboutCtaBody:
    "Whether you're leading a team, a whole company, or figuring out your next chapter as a leader — I'd love to hear where you are. Book a 15-minute call and we'll talk, leader to leader — or see when the next cohort begins.",
  confirmationDisclaimer: "Payment is handled securely and separately — no card details are entered here.",
};

type Content = Record<string, unknown>;

/** Apply `fn` to a section's stored content; write + log only when it changed. */
async function patchSection(key: string, fn: (c: Content) => string[]): Promise<void> {
  const row = await db.query.siteSection.findFirst({ where: eq(siteSection.key, key) });
  if (!row) {
    console.info(`[backfill] ${key}: no stored row — registry default already applies, skipping.`);
    return;
  }
  const content = { ...(row.content as Content) };
  const changed = fn(content);
  if (changed.length === 0) {
    console.info(`[backfill] ${key}: already up to date (or admin-customized), skipping.`);
    return;
  }
  await db.update(siteSection).set({ content, updatedAt: new Date() }).where(eq(siteSection.key, key));
  console.info(`[backfill] ${key}: updated ${changed.join(", ")}.`);
}

async function main() {
  // #7 — remove the "TLC for Organizations" link from the top navigation.
  await patchSection("global.nav", (c) => {
    if (deepEqual(c.links, OLD.navLinks)) {
      c.links = NEW.navLinks;
      return ["links"];
    }
    return [];
  });

  // #9 — About Tri "Meet Your Guide" hero: assessment button → "Return to home".
  await patchSection("aboutTri.hero", (c) => {
    if (deepEqual(c.secondaryCta, OLD.aboutHeroSecondaryCta)) {
      c.secondaryCta = NEW.aboutHeroSecondaryCta;
      return ["secondaryCta"];
    }
    return [];
  });

  // #9 — About Tri "Let's Talk" band: assessment button → "Upcoming Cohort Dates".
  await patchSection("aboutTri.cta", (c) => {
    const changed: string[] = [];
    if (deepEqual(c.primaryCta, OLD.aboutCtaPrimaryCta)) {
      c.primaryCta = NEW.aboutCtaPrimaryCta;
      changed.push("primaryCta");
    }
    if (c.body === OLD.aboutCtaBody) {
      c.body = NEW.aboutCtaBody;
      changed.push("body");
    }
    return changed;
  });

  // #6 — Enrollment confirmation: drop the Stripe / ThriveCart line; ensure the
  // new editable logo + CTA keys exist so the admin can edit them.
  await patchSection("confirmation.main", (c) => {
    const changed: string[] = [];
    if (c.disclaimer === OLD.confirmationDisclaimer) {
      c.disclaimer = NEW.confirmationDisclaimer;
      changed.push("disclaimer");
    }
    if (c.logo === undefined) {
      c.logo = { src: "", alt: "The Wisdom Tri" };
      changed.push("logo");
    }
    if (c.primaryCta === undefined) {
      c.primaryCta = {
        label: "Book an appointment with the trainer",
        href: "https://calendly.com/tri-t-nguyen/tlc-fit-conversation",
      };
      changed.push("primaryCta");
    }
    return changed;
  });

  console.info("[backfill] done.");
}

main()
  .catch((err) => {
    console.error("[backfill] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
