import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Okta from "next-auth/providers/okta";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Corporate SSO (OIDC) is additive and opt-in: only registered when the
 * AUTH_OKTA_* env vars are present, so the base credential flow is unaffected.
 */
export const ssoEnabled = Boolean(
  process.env.AUTH_OKTA_ID && process.env.AUTH_OKTA_SECRET && process.env.AUTH_OKTA_ISSUER,
);

const providers: NextAuthConfig["providers"] = [];
if (ssoEnabled) {
  providers.push(
    Okta({
      clientId: process.env.AUTH_OKTA_ID,
      clientSecret: process.env.AUTH_OKTA_SECRET,
      issuer: process.env.AUTH_OKTA_ISSUER,
    }),
  );
}

providers.push(
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        companyId: user.companyId,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: Role; companyId?: string | null; email?: string | null };
        // Credentials sign-in carries role/companyId. SSO (OIDC) users arrive
        // with only profile fields — resolve their TLC role from the DB by email.
        if (u.role) {
          token.role = u.role;
          token.companyId = u.companyId ?? null;
          token.uid = u.id as string;
        } else if (u.email) {
          const dbUser = await db.user.findUnique({ where: { email: u.email.toLowerCase() } });
          if (dbUser) {
            token.uid = dbUser.id;
            token.role = dbUser.role;
            token.companyId = dbUser.companyId;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = token.role as Role;
        session.user.companyId = (token.companyId as string | null) ?? null;
      }
      return session;
    },
  },
});
