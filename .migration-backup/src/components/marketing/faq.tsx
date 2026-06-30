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
    a: "Two hours a week of live virtual sessions while each session runs, across six months — plus an independent intersession and two private 1:1 coaching sessions. Built to fit a working leader's life, not to add a second job.",
  },
  {
    q: "Who is this for?",
    a: "Advancing leaders through the C-Suite who want to lead through people — not around them. It has nothing to do with how senior you are. Cohorts can also be run privately for a single company's team.",
  },
  {
    q: "I've done leadership training before. How is this different?",
    a: "Most training adds to what you do. TLC works on who you are underneath it — the part that decides how you lead under pressure. That's why it holds when the old patterns would normally return.",
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
