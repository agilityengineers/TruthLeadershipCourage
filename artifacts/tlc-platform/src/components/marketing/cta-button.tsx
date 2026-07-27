import { Link } from "wouter";
import { Button, type ButtonProps } from "@/components/ui/button";

type Cta = { label: string; href: string };

/**
 * A call-to-action rendered as a Button. When the href is an absolute URL
 * (e.g. the Calendly scheduler) it renders a real anchor that opens in a new
 * tab; an internal path (/…) uses wouter's client-side Link. This lets an admin
 * point any CTA at an external booking link without breaking in-app routing.
 */
export function CtaButton({ cta, ...props }: { cta: Cta } & ButtonProps) {
  const external = /^https?:\/\//i.test(cta.href);
  return (
    <Button {...props} asChild>
      {external ? (
        <a href={cta.href} target="_blank" rel="noopener noreferrer">
          {cta.label}
        </a>
      ) : (
        <Link href={cta.href}>{cta.label}</Link>
      )}
    </Button>
  );
}
