import { Router, type IRouter } from "express";
import { AcceptInviteBody } from "@workspace/api-zod";
import { db, schema, eq } from "../lib/db";
import { asyncHandler, HttpError } from "../lib/http";
import { hashPassword } from "../lib/password";
import { audit } from "../lib/services";

const router: IRouter = Router();
const MIN_PASSWORD_LEN = 8;

async function loadInvite(token: string) {
  const row = await db.query.verificationToken.findFirst({
    where: eq(schema.verificationToken.token, token),
  });
  if (!row) return null;
  if (row.expires.getTime() < Date.now())
    return { expired: true as const, userId: row.identifier };
  return { expired: false as const, userId: row.identifier };
}

/** Validate an invite token and return who it is for (public — used by the set-password page). */
router.get(
  "/invite/:token",
  asyncHandler(async (req, res) => {
    const invite = await loadInvite(String(req.params.token));
    if (!invite || invite.expired)
      throw new HttpError(410, "This invite link is invalid or has expired.");
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, invite.userId),
    });
    if (!user)
      throw new HttpError(410, "This invite link is invalid or has expired.");
    res.json({ email: user.email, name: user.name });
  }),
);

/** Consume an invite token: set the user's password and activate the account. */
router.post(
  "/invite/:token/accept",
  asyncHandler(async (req, res) => {
    const { password } = AcceptInviteBody.parse(req.body);
    if (!password || password.length < MIN_PASSWORD_LEN) {
      throw new HttpError(
        400,
        `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      );
    }
    const invite = await loadInvite(String(req.params.token));
    if (!invite || invite.expired)
      throw new HttpError(410, "This invite link is invalid or has expired.");
    const passwordHash = await hashPassword(password);
    await db.transaction(async (tx) => {
      await tx
        .update(schema.user)
        .set({ passwordHash, status: "active" })
        .where(eq(schema.user.id, invite.userId));
      await tx
        .delete(schema.verificationToken)
        .where(eq(schema.verificationToken.identifier, invite.userId));
    });
    await audit({
      actorId: invite.userId,
      action: "user.accept_invite",
      entity: "User",
      entityId: invite.userId,
    });
    res.json({ ok: true });
  }),
);

export default router;
