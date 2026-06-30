import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const NAV: { label: string; href: string; route: boolean }[] = [
  { label: "TLC for Leaders", href: "/", route: true },
  { label: "TLC for Organizations", href: "/organizations", route: true },
  { label: "About Tri", href: "#guide", route: false },
  { label: "Stories", href: "#stories", route: false },
];

export function LandingNav() {
  const [location] = useLocation();
  const onLanding = location === "/" || location === "";
  // On the landing page, scroll in place; elsewhere, route home then scroll.
  const anchorHref = (hash: string) =>
    onLanding ? hash : `${import.meta.env.BASE_URL}${hash}`;

  return (
    <div className="sticky top-0 z-50 border-b border-[#ececf2] bg-white/[.92] backdrop-blur-md">
      <div className="shell flex items-center gap-3.5 py-3.5">
        <Link href="/" className="flex items-center" aria-label="The Wisdom Tri home">
          <img
            src="/brand/wisdomtri-logo.jpg"
            alt="The Wisdom Tri"
            width={132}
            height={132}
            className="h-[88px] w-[88px] object-contain lg:h-[112px] lg:w-[112px]"
          />
        </Link>
        <nav className="ml-6 hidden gap-6 md:flex">
          {NAV.map((n) =>
            n.route ? (
              <Link
                key={n.href}
                href={n.href}
                className="text-[13.5px] font-medium text-[#55596e] transition-colors hover:text-eq"
              >
                {n.label}
              </Link>
            ) : (
              <a
                key={n.href}
                href={anchorHref(n.href)}
                className="text-[13.5px] font-medium text-[#55596e] transition-colors hover:text-eq"
              >
                {n.label}
              </a>
            )
          )}
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
