import { Link, useSearch } from "wouter";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { usePageContent } from "@/lib/site-content";

type Img = { src: string; alt: string };
type Lnk = { label: string; href: string };

/** A wouter route ("/…") renders in-app; a full URL opens in a new tab. */
function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function ConfirmationPage() {
  const params = new URLSearchParams(useSearch());
  const status = params.get("status") ?? undefined;
  const waitlisted = status === "WAITLISTED";
  const c = (usePageContent("confirmation").content("confirmation.main") ?? {
    logo: { src: "", alt: "The Wisdom Tri" },
    heading: "Your seat is reserved.",
    body: "Thank you for answering the call. We'll email you to confirm payment and shipping. Once payment is complete, your portal unlocks and your workbook ships before kickoff.",
    waitlistHeading: "You're on the waitlist.",
    waitlistBody: "This cohort is currently full. We'll email you the moment a seat opens — no further action needed.",
    primaryCta: {
      label: "Book an appointment with the trainer",
      href: "https://calendly.com/tri-t-nguyen/tlc-fit-conversation",
    },
    disclaimer: "Payment is handled securely and separately — no card details are entered here.",
  }) as {
    logo?: Img;
    heading: string;
    body: string;
    waitlistHeading: string;
    waitlistBody: string;
    primaryCta?: Lnk;
    disclaimer: string;
  };

  const cta = c.primaryCta?.label?.trim() ? c.primaryCta : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      {/* Circle logo, on its own — an uploaded logo overrides the default mark. */}
      {c.logo?.src ? (
        <img
          src={c.logo.src}
          alt={c.logo.alt || "The Wisdom Tri"}
          width={96}
          height={96}
          className="h-24 w-24 object-contain"
        />
      ) : (
        <Logo size={96} href="/" />
      )}
      <div className="mt-8 max-w-[40em] rounded-[18px] border border-hair-1 bg-white p-10 shadow-card">
        {waitlisted ? (
          <Clock className="mx-auto h-12 w-12 text-warning" />
        ) : (
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        )}
        <h1 className="mt-5 font-display text-[clamp(26px,3.4vw,36px)] text-ink">
          {waitlisted ? c.waitlistHeading : c.heading}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          {waitlisted ? c.waitlistBody : c.body}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          {cta &&
            (isExternal(cta.href) ? (
              <Button asChild size="lg">
                <a href={cta.href} target="_blank" rel="noreferrer">
                  {cta.label}
                </a>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            ))}
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in to your portal</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
      {c.disclaimer?.trim() && (
        <p className="mt-5 max-w-[36em] text-[12.5px] leading-relaxed text-muted-2">{c.disclaimer}</p>
      )}
    </div>
  );
}
