import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = [
  {
    q: "What is the time commitment?",
    a: "Live virtual sessions of about two hours a week across six months — built around a working leader's schedule — plus an independent intersession and two private 1:1 coaching sessions.",
  },
  {
    q: "Who is this for?",
    a: "Advancing leaders on the path to the C-Suite who want to lead through people — not around them. Cohorts can also be run privately for a single company's leadership team.",
  },
  {
    q: "I've done leadership training before. How is this different?",
    a: "Most training adds tools that fade under pressure. TLC builds the leader underneath the tools — the 77% of how you show up that no tactic alone can produce — so it holds in real moments, not just in the room.",
  },
  {
    q: "What happens after I start the assessment?",
    a: "You'll see your personalized leadership snapshot and how TLC maps to it, then a short path to book a fit conversation and, if it's a match, reserve your seat in an upcoming cohort.",
  },
];

export function FAQ() {
  return (
    <Accordion
      type="single"
      collapsible
      className="overflow-hidden rounded-[16px] border border-white/[.12] bg-white/[.06]"
    >
      {ITEMS.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
