import { Link } from "wouter";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
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

  if (!ready || !c) return <div className="min-h-screen bg-soft-3" />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      <Logo size={56} withWordmark subtitle="The Wisdom Tri" />
      <h1 className="mt-8 font-display text-[clamp(28px,4vw,40px)] text-ink">{c.heading}</h1>
      <p className="mt-3 max-w-[34em] text-[16px] leading-relaxed text-muted">{c.body}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
        <Button asChild size="lg">
          <Link href={c.primaryCta.href}>{c.primaryCta.label}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={c.secondaryCta.href}>{c.secondaryCta.label}</Link>
        </Button>
      </div>
    </div>
  );
}
