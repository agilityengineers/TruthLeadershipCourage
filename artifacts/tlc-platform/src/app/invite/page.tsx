import { useState } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { toast } from "sonner";
import {
  useGetInvite,
  useAcceptInvite,
  getGetInviteQueryKey,
} from "@workspace/api-client-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errMsg(e: unknown): string {
  const data = (e as { data?: { error?: string } })?.data;
  return (
    data?.error ?? (e instanceof Error ? e.message : "Something went wrong.")
  );
}

export default function InvitePage() {
  const params = new URLSearchParams(useSearch());
  const token = params.get("token") ?? "";
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    data: invite,
    isLoading,
    isError,
  } = useGetInvite(token, {
    query: {
      enabled: Boolean(token),
      retry: false,
      queryKey: getGetInviteQueryKey(token),
    },
  });
  const accept = useAcceptInvite();

  const invalid = !token || isError;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-3 px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center justify-center gap-3">
          <Logo size={70} withWordmark subtitle="TLC Platform" href="/" />
        </div>
        <div className="rounded-[18px] border border-hair-1 bg-white p-8 shadow-card">
          {invalid ? (
            <>
              <h1 className="font-display text-[26px] text-ink">
                Invite unavailable
              </h1>
              <p className="mt-1 text-sm text-muted">
                This invite link is invalid or has expired. Ask an administrator
                to send a new one.
              </p>
            </>
          ) : isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : (
            <>
              <h1 className="font-display text-[26px] text-ink">
                Set your password
              </h1>
              <p className="mt-1 text-sm text-muted">
                Welcome{invite?.name ? `, ${invite.name}` : ""}. Choose a
                password to activate{" "}
                <span className="font-semibold text-ink">{invite?.email}</span>.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const fd = new FormData(e.currentTarget);
                  const password = String(fd.get("password") || "");
                  const confirm = String(fd.get("confirm") || "");
                  if (password.length < 8) {
                    setError("Password must be at least 8 characters.");
                    return;
                  }
                  if (password !== confirm) {
                    setError("Passwords do not match.");
                    return;
                  }
                  try {
                    await accept.mutateAsync({ token, data: { password } });
                    toast.success("Password set — you can sign in now.");
                    navigate("/login");
                  } catch (err) {
                    setError(errMsg(err));
                  }
                }}
                className="mt-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p
                    role="alert"
                    className="text-[13px] font-medium text-danger"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={accept.isPending}
                >
                  {accept.isPending ? "Saving…" : "Set password & activate"}
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-[12.5px] text-muted-2">
          Already have access?{" "}
          <Link href="/login" className="font-semibold text-eq">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
