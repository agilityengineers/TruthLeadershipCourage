import type { ComponentType } from "react";
import {
  HomeHero,
  HomeTrustStrip,
  HomeProblem,
  HomePromise,
  HomeGuide,
  HomePlan,
  HomeOutcomes,
  HomeGlance,
  HomeStories,
  HomeWhoFor,
  HomeFinalCta,
} from "./home";
import {
  OrgHero,
  OrgProblem,
  OrgFormula,
  OrgScales,
  OrgWhatChanges,
  OrgDifference,
  OrgBuiltFor,
  OrgProof,
  OrgGetStarted,
} from "./organizations";

type SectionComponent = ComponentType<{ content: Record<string, unknown> }>;

/** Maps a section key to its presentational component. */
export const SECTION_COMPONENTS: Record<string, SectionComponent> = {
  "home.hero": HomeHero,
  "home.trustStrip": HomeTrustStrip,
  "home.problem": HomeProblem,
  "home.promise": HomePromise,
  "home.guide": HomeGuide,
  "home.plan": HomePlan,
  "home.outcomes": HomeOutcomes,
  "home.glance": HomeGlance,
  "home.stories": HomeStories,
  "home.whoFor": HomeWhoFor,
  "home.finalCta": HomeFinalCta,
  "org.hero": OrgHero,
  "org.problem": OrgProblem,
  "org.formula": OrgFormula,
  "org.scales": OrgScales,
  "org.whatChanges": OrgWhatChanges,
  "org.difference": OrgDifference,
  "org.builtFor": OrgBuiltFor,
  "org.proof": OrgProof,
  "org.getStarted": OrgGetStarted,
};
