import { Logo } from "@/components/brand/logo";
import { CtaButton } from "@/components/marketing/cta-button";
import { CheckCircle2 } from "lucide-react";
import { usePageContent } from "@/lib/site-content";

/**
 * The page Calendly redirects to after a fit conversation is booked. Set this
 * URL as the confirmation redirect on the Calendly event type:
 *   https://<your-domain>/book-a-call/confirmed
 * Copy is admin-editable via the "Call-booked confirmation" content section.
 */
export default function BookACallConfirmedPage() {
  // Render immediately with a fallback (like the enroll confirmation page) so a
  // visitor Calendly redirects here always sees the thank-you, even before the
  // content API responds.
  const c = (usePageContent("book-a-call-confirmed").content("bookACall.confirmed") ?? {
    heading: "Your call is booked.",
    body: "Thank you — your fit conversation with Tri is on the calendar. Calendly just emailed you the details and a calendar invite. While you're here, the two-minute assessment is the best way to arrive ready.",
    primaryCta: { label: "Take the 2-minute assessment →", href: "/assessment" },
    secondaryCta: { label: "Back to home", href: "/" },
  }) as {
    heading: string;
    body: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      <Logo size={48} withWordmark subtitle="The Wisdom Tri" />
      <div className="mt-8 max-w-[40em] rounded-[18px] border border-hair-1 bg-white p-10 shadow-card">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-5 font-display text-[clamp(26px,3.4vw,36px)] text-ink">{c.heading}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{c.body}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          <CtaButton cta={c.primaryCta} size="lg" />
          <CtaButton cta={c.secondaryCta} size="lg" variant="outline" />
        </div>
      </div>
    </div>
  );
}
