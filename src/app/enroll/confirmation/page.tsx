import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

export const metadata = { title: "Enrollment received" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const waitlisted = status === "WAITLISTED";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 text-center">
      <Logo size={48} withWordmark subtitle="The Wisdom Tri" />
      <div className="mt-8 max-w-[40em] rounded-[18px] border border-hair-1 bg-white p-10 shadow-card">
        {waitlisted ? (
          <Clock className="mx-auto h-12 w-12 text-warning" />
        ) : (
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        )}
        <h1 className="mt-5 font-display text-[clamp(26px,3.4vw,36px)] text-ink">
          {waitlisted ? "You're on the waitlist." : "Your seat is reserved."}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          {waitlisted
            ? "This cohort is currently full. We'll email you the moment a seat opens — no further action needed."
            : "Thank you for answering the call. We'll email you to confirm payment and shipping. Once payment is complete, your portal unlocks and your workbook ships before kickoff."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
          <Button asChild size="lg">
            <Link href="/login">Sign in to your portal</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
      <p className="mt-5 max-w-[36em] text-[12.5px] leading-relaxed text-muted-2">
        Payment is processed securely off-site (Stripe / ThriveCart). The TLC platform never collects
        card details.
      </p>
    </div>
  );
}
