import { Link } from "wouter";

/**
 * The quiet row: reliable access, no shouting. Always the same four doors in
 * the same place at the bottom of the home screen.
 */
const LINKS = [
  { label: "Workbook", href: "/portal/workbook" },
  { label: "Schedule", href: "/portal/coaching" },
  { label: "References", href: "/portal/library" },
  { label: "Trainer", href: "/portal/messages" },
];

export function QuietRow() {
  return (
    <nav
      aria-label="Quick access"
      className="flex items-center justify-between border-t border-hair-2 px-2 pb-1 pt-3.5"
    >
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-[12.5px] font-medium text-muted-2 transition-colors hover:text-indigo"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
