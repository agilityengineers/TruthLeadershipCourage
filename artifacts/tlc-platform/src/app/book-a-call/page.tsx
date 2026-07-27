import { Logo } from "@/components/brand/logo";
import { CtaButton } from "@/components/marketing/cta-button";
import { usePageContent } from "@/lib/site-content";

export default function BookACallPage() {
  const { ready, content } = usePageContent("book-a-call");
  const c = content("bookACall.main") as
    | {
        heading: string;
        body: string;
        primaryCta: { label: string; href: string };
        secondaryCta: { label: string; href: string };
      }
    | undefined;
  const assessmentOn =
    (content("global.settings") as { assessmentEnabled?: boolean } | undefined)?.assessmentEnabled === true;

  if (!ready || !c) return <div className="min-h-screen bg-soft-3" />;

  // Hide a call-to-action that points at the assessment while it's turned off.
  const showPrimary = assessmentOn || c.primaryCta.href !== "/assessment";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      <Logo size={56} withWordmark subtitle="The Wisdom Tri" />
      <h1 className="mt-8 font-display text-[clamp(28px,4vw,40px)] text-ink">{c.heading}</h1>
      <p className="mt-3 max-w-[34em] text-[16px] leading-relaxed text-muted">{c.body}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
        {showPrimary && <CtaButton cta={c.primaryCta} size="lg" />}
        <CtaButton cta={c.secondaryCta} size="lg" variant="outline" />
      </div>
    </div>
  );
}
