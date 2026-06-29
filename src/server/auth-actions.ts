"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { homeForRole } from "@/lib/rbac";

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "");

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
