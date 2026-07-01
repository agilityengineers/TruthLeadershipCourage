import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setSession } from "@/lib/session";
import { homeForRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").toLowerCase();
    const password = String(fd.get("password") ?? "");
    try {
      const res = await login.mutateAsync({ data: { email, password } });
      setSession(
        {
          id: res.user.id,
          role: res.user.role,
          companyId: res.user.companyId ?? null,
          name: res.user.name ?? null,
          email: res.user.email,
        },
        res.token,
      );
      navigate(callbackUrl || homeForRole(res.user.role));
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
