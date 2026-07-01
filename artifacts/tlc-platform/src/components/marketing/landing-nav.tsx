import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type NavContent = {
  logoAlt: string;
  links: { label: string; href: string }[];
  bookCall: { label: string; href: string };
  cta: { label: string; href: string };
};

/** A link that is a wouter route ("/...") or an in-page anchor ("#..."). */
function isRoute(href: string) {
  return href.startsWith("/");
}

export function LandingNav({ content }: { content: NavContent }) {
  const { logoAlt, links, bookCall, cta } = content;
  const [location] = useLocation();
  const onLanding = location === "/" || location === "";
  const anchorHref = (hash: string) => (onLanding ? hash : `${import.meta.env.BASE_URL}${hash}`);

  return (
    <div className="sticky top-0 z-50 border-b border-[#ececf2] bg-white/[.92] backdrop-blur-md">
      <div className="shell flex items-center gap-3.5 py-3.5">
        <Link href="/" className="flex items-center" aria-label="The Wisdom Tri home">
          <img
            src="/brand/wisdomtri-logo.png"
            alt={logoAlt}
            width={132}
            height={132}
            className="h-[88px] w-[88px] object-contain lg:h-[112px] lg:w-[112px]"
          />
        </Link>
        <nav className="ml-6 hidden gap-6 md:flex">
          {links.map((n) =>
            isRoute(n.href) ? (
              <Link
                key={n.href + n.label}
                href={n.href}
                className="text-[13.5px] font-medium text-[#55596e] transition-colors hover:text-eq"
              >
                {n.label}
              </Link>
            ) : (
              <a
                key={n.href + n.label}
                href={anchorHref(n.href)}
                className="text-[13.5px] font-medium text-[#55596e] transition-colors hover:text-eq"
              >
                {n.label}
              </a>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <Link href={bookCall.href} className="hidden text-[13.5px] font-semibold text-eq sm:inline">
            {bookCall.label}
          </Link>
          <Button asChild size="md">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
