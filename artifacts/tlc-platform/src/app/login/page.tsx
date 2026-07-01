import { Link, useSearch } from "wouter";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";
import { ssoLoginAction } from "@/server/auth-actions";
import { Button } from "@/components/ui/button";
import { usePageContent } from "@/lib/site-content";

export default function LoginPage() {
  const params = new URLSearchParams(useSearch());
  const callbackUrl = params.get("callbackUrl") ?? undefined;
  const ssoEnabled = false;
  // Editable intro copy; falls back to defaults so the form never waits on it.
  const intro = (usePageContent("login").content("login.intro") ?? {
    heading: "Welcome back",
    body: "Sign in to your TLC portal.",
  }) as { heading: string; body: string };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-3">
          <Logo size={44} withWordmark subtitle="TLC Platform" href="/" />
        </div>
        <div className="rounded-[18px] border border-hair-1 bg-white p-8 shadow-card">
          <h1 className="font-display text-[26px] text-ink">{intro.heading}</h1>
          <p className="mt-1 text-sm text-muted">{intro.body}</p>
          <LoginForm callbackUrl={callbackUrl} />
          {ssoEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-[12px] text-muted-3">
                <span className="h-px flex-1 bg-hair-1" /> or <span className="h-px flex-1 bg-hair-1" />
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => ssoLoginAction()}>
                Sign in with corporate SSO
              </Button>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-[12.5px] text-muted-2">
          New here?{" "}
          <Link href="/assessment" className="font-semibold text-eq">
            Start the assessment →
          </Link>
        </p>
        {import.meta.env.MODE !== "production" && (
          <div className="mt-6 rounded-[12px] border border-hair-2 bg-white/60 p-4 text-[12px] leading-relaxed text-muted-2">
            <span className="font-semibold text-ink">Demo logins</span> (password{" "}
            <code className="rounded bg-page px-1">password123</code>):<br />
            admin@thewisdomtri.com · tri@thewisdomtri.com · jordan@acme.test · viewer@acme.test
          </div>
        )}
      </div>
    </div>
  );
}
