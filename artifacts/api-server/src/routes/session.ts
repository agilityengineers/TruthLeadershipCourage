import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { LoginBody } from "@workspace/api-zod";
import { db, schema, eq, desc } from "../lib/db";
import { asyncHandler, unauthorized } from "../lib/http";
import { loadPrincipal, requirePrincipal } from "../lib/principal";
import { verifyPassword } from "../lib/password";
import { audit } from "../lib/services";

const router: IRouter = Router();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Password login: verifies the email against the account's own stored hash. */
router.post(
  "/session/login",
  asyncHandler(async (req, res) => {
    const { email, password } = LoginBody.parse(req.body);
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, String(email).toLowerCase()),
    });
    if (!user) throw unauthorized("Invalid email or password.");
    // Deactivated or not-yet-onboarded accounts cannot sign in.
    if (user.status !== "active") {
      throw unauthorized(
        "This account is not active. Contact an administrator.",
      );
    }
    // Authenticate against the account's own stored password hash. Accounts
    // with no password set (null hash) always fail here and must set one via
    // the invite / set-password flow before they can sign in.
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid email or password.");
    const token = randomUUID();
    await db.insert(schema.session).values({
      sessionToken: token,
      userId: user.id,
      expires: new Date(Date.now() + SESSION_TTL_MS),
    });
    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId ?? null,
        name: user.name,
        email: user.email,
      },
    });
  }),
);

router.post(
  "/session/logout",
  asyncHandler(async (req, res) => {
    const auth = req.headers["authorization"];
    const token =
      typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")
        ? auth.slice(7).trim()
        : (req.headers["x-session-token"] as string | undefined);
    if (token) {
      // Look the row up first: ending an impersonation session must leave an
      // audit trail attributed to the admin who was driving it.
      const row = await db.query.session.findFirst({
        where: eq(schema.session.sessionToken, token),
      });
      await db
        .delete(schema.session)
        .where(eq(schema.session.sessionToken, token));
      if (row?.impersonatorId) {
        await audit({
          actorId: row.impersonatorId,
          action: "impersonation.stop",
          entity: "User",
          entityId: row.userId,
        });
      }
    }
    res.json({ ok: true });
  }),
);

/** Current user context for dashboard layouts. */
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const p = await requirePrincipal(req);
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, p.id),
      with: { company: true },
    });
    if (!user) throw unauthorized();
    const primary = await db.query.enrollment.findFirst({
      where: eq(schema.enrollment.userId, p.id),
      orderBy: [desc(schema.enrollment.createdAt)],
      with: { cohort: { columns: { name: true } } },
    });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      status: user.status,
      companyId: user.companyId ?? null,
      company: user.company
        ? { id: user.company.id, name: user.company.name }
        : null,
      primaryCohortName: primary?.cohort?.name ?? null,
      impersonatorId: p.impersonatorId ?? null,
    });
  }),
);

export default router;
export { loadPrincipal };
