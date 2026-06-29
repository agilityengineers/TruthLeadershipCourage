import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-3">
          <Logo size={44} withWordmark subtitle="TLC Platform" href="/" />
        </div>
        <div className="rounded-[18px] border border-hair-1 bg-white p-8 shadow-card">
          <h1 className="font-display text-[26px] text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your TLC portal.</p>
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-5 text-center text-[12.5px] text-muted-2">
          New here?{" "}
          <Link href="/assessment" className="font-semibold text-eq">
            Start the assessment →
          </Link>
        </p>
        <div className="mt-6 rounded-[12px] border border-hair-2 bg-white/60 p-4 text-[12px] leading-relaxed text-muted-2">
          <span className="font-semibold text-ink">Demo logins</span> (password{" "}
          <code className="rounded bg-page px-1">password123</code>):<br />
          admin@thewisdomtri.com · tri@thewisdomtri.com · jordan@acme.test · viewer@acme.test
        </div>
      </div>
    </div>
  );
}
