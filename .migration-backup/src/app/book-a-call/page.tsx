import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Book a call" };

export default function BookACallPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      <Logo size={56} withWordmark subtitle="The Wisdom Tri" />
      <h1 className="mt-8 font-display text-[clamp(28px,4vw,40px)] text-ink">
        Let's talk about your leadership.
      </h1>
      <p className="mt-3 max-w-[34em] text-[16px] leading-relaxed text-muted">
        Book a 15-minute call with Tri to see whether the next cohort is the right fit. Most
        leaders start with the two-minute assessment first.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
        <Button asChild size="lg">
          <Link href="/assessment">Start the Assessment →</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
