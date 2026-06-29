"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { homeForRole } from "@/lib/rbac";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

  // Throttle credential attempts per IP+email to blunt brute force.
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}:${email}`, { limit: 5, windowMs: 15 * 60_000 }).ok) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const redirectTo = callbackUrl || homeForRole(user?.role);

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // redirect throws — let it propagate
  }
  return { error: null };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

/** Corporate SSO sign-in (OIDC) — only meaningful when AUTH_OKTA_* are set. */
export async function ssoLoginAction() {
  await signIn("okta", { redirectTo: "/portal" });
}
