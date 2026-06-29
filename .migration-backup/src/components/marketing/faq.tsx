"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = [
  {
    q: "What is the time commitment?",
    a: "Weekly live virtual sessions on Thursdays, 9–11 AM PST, across six months — plus a 10-week independent intersession and two private 1:1 coaching sessions.",
  },
  {
    q: "Who is this for?",
    a: "Advancing leaders on the path to the C-Suite who want to lead through people — not around them. Cohorts can also be run privately for a single company's team.",
  },
  {
    q: "What's included?",
    a: "All weekly training and materials, a shipped physical workbook plus digital versions, two 1:1 coaching sessions, and lifetime access to the resource library after you complete.",
  },
  {
    q: "What happens after I start the assessment?",
    a: "You'll see your personalized leadership snapshot and how TLC maps to it, then a short path to reserve your seat in the cohort and complete enrollment.",
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
