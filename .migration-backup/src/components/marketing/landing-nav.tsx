import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Why TLC", href: "#why" },
  { label: "The Program", href: "#program" },
  { label: "About Tri", href: "#guide" },
  { label: "Stories", href: "#stories" },
];

export function LandingNav() {
  return (
    <div className="sticky top-0 z-50 border-b border-[#ececf2] bg-white/[.92] backdrop-blur-md">
      <div className="shell flex items-center gap-3.5 py-3.5">
        <Link href="/" className="flex items-center" aria-label="The Wisdom Tri home">
          <Image
            src="/brand/wisdomtri-logo.jpg"
            alt="The Wisdom Tri"
            width={102}
            height={102}
            className="h-[68px] w-[68px] object-contain lg:h-[88px] lg:w-[88px]"
            priority
          />
        </Link>
        <nav className="ml-6 hidden gap-6 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[13.5px] font-medium text-[#55596e] transition-colors hover:text-eq"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <Link
            href="/book-a-call"
            className="hidden text-[13.5px] font-semibold text-eq sm:inline"
          >
            Book a call
          </Link>
          <Button asChild size="md">
            <Link href="/assessment">Start the Assessment</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
