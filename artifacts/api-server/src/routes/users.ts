import { Router, type IRouter } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";
import { db, schema, eq, and, ne, or, inArray, asc, count } from "../lib/db";
import { asyncHandler, HttpError, forbidden } from "../lib/http";
import { requireCapability } from "../lib/principal";
import { hashPassword } from "../lib/password";
import { audit } from "../lib/services";
import type { Role } from "../lib/rbac";

const router: IRouter = Router();

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IMPERSONATION_TTL_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LEN = 8;

const isAdminRole = (role: string) =>
  role === "ADMIN" || role === "SUPER_ADMIN";
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Count admins that are currently able to sign in, optionally excluding one id. */
async function activeAdminCount(excludeId?: string): Promise<number> {
  const clauses = [
    inArray(schema.user.role, ADMIN_ROLES),
    eq(schema.user.status, "active"),
  ];
  if (excludeId) clauses.push(ne(schema.user.id, excludeId));
  const [row] = await db
    .select({ n: count() })
    .from(schema.user)
    .where(and(...clauses));
  return Number(row?.n ?? 0);
}

/** Mint a fresh single-use invite/set-password token for a user. */
async function issueInvite(
  userId: string,
): Promise<{ token: string; path: string }> {
  await db
    .delete(schema.verificationToken)
    .where(eq(schema.verificationToken.identifier, userId));
  const token = randomBytes(32).toString("hex");
  await db.insert(schema.verificationToken).values({
    identifier: userId,
    token,
    expires: new Date(Date.now() + INVITE_TTL_MS),
  });
  return { token, path: `/invite?token=${token}` };
}

/** List all platform users. */
router.get(
  "/admin/users",
  asyncHandler(async (req, res) => {
    await requireCapability(req, "user:manage");
    const users = await db.query.user.findMany({
      orderBy: [asc(schema.user.name)],
      with: { company: { columns: { id: true, name: true } } },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        title: u.title,
        companyId: u.companyId ?? null,
        companyName: u.company?.name ?? null,
        hasPassword: Boolean(u.passwordHash),
        createdAt: u.createdAt,
      })),
    );
  }),
);

/** Create a user (admins included). Either set an initial password or send an invite link. */
router.post(
  "/admin/users",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "user:manage");
    const body = CreateUserBody.parse(req.body);
    const email = normalizeEmail(body.email);
    const role = body.role as Role;

    if (role === "SUPER_ADMIN" && principal.role !== "SUPER_ADMIN") {
      throw forbidden("Only a super admin can create super admins.");
    }
    if (role === "COMPANY_VIEWER" && !body.companyId) {
      throw new HttpError(400, "A company is required for company viewers.");
    }
    if (body.companyId) {
      const company = await db.query.company.findFirst({
        where: eq(schema.company.id, body.companyId),
      });
      if (!company) throw new HttpError(400, "Unknown company.");
    }
    const existing = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });
    if (existing)
      throw new HttpError(409, "A user with that email already exists.");

    const mode = body.mode ?? "invite";
    let passwordHash: string | null = null;
    let status = "invited";
    if (mode === "password") {
      if (!body.password || body.password.length < MIN_PASSWORD_LEN) {
        throw new HttpError(
          400,
          `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
        );
      }
      passwordHash = await hashPassword(body.password);
      status = "active";
    }

    const [created] = await db
      .insert(schema.user)
      .values({
        email,
        name: body.name?.trim() || null,
        role,
        title: body.title?.trim() || null,
        companyId: body.companyId || null,
        status,
        passwordHash,
      })
      .returning();

    const invite = mode === "invite" ? await issueInvite(created!.id) : null;
    await audit({
      actorId: principal.id,
      action: "user.create",
      entity: "User",
      entityId: created!.id,
      meta: { role, mode },
    });
    res.json({
      ok: true,
      id: created!.id,
      inviteToken: invite?.token ?? null,
      invitePath: invite?.path ?? null,
    });
  }),
);

/** (Re)issue an invite / set-password link for an existing user. */
router.post(
  "/admin/users/:id/invite",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "user:manage");
    const target = await db.query.user.findFirst({
      where: eq(schema.user.id, String(req.params.id)),
    });
    if (!target) throw new HttpError(404, "User not found.");
    if (target.role === "SUPER_ADMIN" && principal.role !== "SUPER_ADMIN") {
      throw forbidden("Only a super admin can manage super admins.");
    }
    const invite = await issueInvite(target.id);
    await audit({
      actorId: principal.id,
      action: "user.invite",
      entity: "User",
      entityId: target.id,
    });
    res.json({
      ok: true,
      id: target.id,
      inviteToken: invite.token,
      invitePath: invite.path,
    });
  }),
);

/**
 * Mint a short-lived session as another (non-admin) user so an admin can see
 * the platform exactly as they do. The admin's own session stays untouched;
 * the new session records who is driving it via `impersonatorId`.
 */
router.post(
  "/admin/users/:id/impersonate",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "user:impersonate");
    if (principal.impersonatorId) {
      throw forbidden("You cannot impersonate while already impersonating.");
    }
    const target = await db.query.user.findFirst({
      where: eq(schema.user.id, String(req.params.id)),
    });
    if (!target) throw new HttpError(404, "User not found.");
    if (target.id === principal.id) {
      throw forbidden("You cannot impersonate yourself.");
    }
    if (isAdminRole(target.role)) {
      throw forbidden("Administrators cannot be impersonated.");
    }
    if (target.status !== "active") {
      throw new HttpError(409, "Only active accounts can be impersonated.");
    }

    const token = randomUUID();
    await db.insert(schema.session).values({
      sessionToken: token,
      userId: target.id,
      expires: new Date(Date.now() + IMPERSONATION_TTL_MS),
      impersonatorId: principal.id,
    });
    await audit({
      actorId: principal.id,
      action: "impersonation.start",
      entity: "User",
      entityId: target.id,
      meta: { targetEmail: target.email, targetRole: target.role },
    });
    res.json({
      token,
      user: {
        id: target.id,
        role: target.role,
        companyId: target.companyId ?? null,
        name: target.name,
        email: target.email,
      },
    });
  }),
);

/** Update a user's profile / role / status. */
router.patch(
  "/admin/users/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "user:manage");
    const body = UpdateUserBody.parse(req.body);
    const target = await db.query.user.findFirst({
      where: eq(schema.user.id, String(req.params.id)),
    });
    if (!target) throw new HttpError(404, "User not found.");

    const nextRole = (body.role ?? target.role) as Role;
    const nextStatus = body.status ?? target.status;

    // Self-protection: an admin cannot change their own role or lock themselves out.
    if (target.id === principal.id) {
      if (body.role !== undefined && body.role !== target.role)
        throw forbidden("You cannot change your own role.");
      if (body.status !== undefined && body.status !== target.status)
        throw forbidden("You cannot change your own status.");
    }
    // Super-admin is gated to super-admins (both when touching one and when granting the role).
    if (
      (target.role === "SUPER_ADMIN" || nextRole === "SUPER_ADMIN") &&
      principal.role !== "SUPER_ADMIN"
    ) {
      throw forbidden("Only a super admin can manage super admins.");
    }
    // Never leave the platform without a signed-in-capable admin.
    const wasActiveAdmin =
      isAdminRole(target.role) && target.status === "active";
    const willBeActiveAdmin = isAdminRole(nextRole) && nextStatus === "active";
    if (
      wasActiveAdmin &&
      !willBeActiveAdmin &&
      (await activeAdminCount(target.id)) === 0
    ) {
      throw new HttpError(409, "At least one active admin must remain.");
    }
    if (body.companyId) {
      const company = await db.query.company.findFirst({
        where: eq(schema.company.id, body.companyId),
      });
      if (!company) throw new HttpError(400, "Unknown company.");
    }

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name?.trim() || null;
    if (body.title !== undefined) patch.title = body.title?.trim() || null;
    if (body.role !== undefined) patch.role = body.role;
    if (body.status !== undefined) patch.status = body.status;
    if (body.companyId !== undefined) patch.companyId = body.companyId || null;
    if (Object.keys(patch).length > 0) {
      await db
        .update(schema.user)
        .set(patch)
        .where(eq(schema.user.id, target.id));
    }
    await audit({
      actorId: principal.id,
      action: "user.update",
      entity: "User",
      entityId: target.id,
      meta: patch,
    });
    res.json({ ok: true });
  }),
);

/** Permanently delete a user (guarded: refuses when the user owns real content). */
router.delete(
  "/admin/users/:id",
  asyncHandler(async (req, res) => {
    const principal = await requireCapability(req, "user:manage");
    const target = await db.query.user.findFirst({
      where: eq(schema.user.id, String(req.params.id)),
    });
    if (!target) throw new HttpError(404, "User not found.");
    if (target.id === principal.id)
      throw forbidden("You cannot delete your own account.");
    if (target.role === "SUPER_ADMIN" && principal.role !== "SUPER_ADMIN") {
      throw forbidden("Only a super admin can delete super admins.");
    }
    if (
      isAdminRole(target.role) &&
      target.status === "active" &&
      (await activeAdminCount(target.id)) === 0
    ) {
      throw new HttpError(409, "At least one active admin must remain.");
    }

    // Refuse to erase real history — enrollments, messages, trainer records, etc.
    const id = target.id;
    const blockers: string[] = [];
    const has = async (p: Promise<unknown>, label: string) => {
      if (await p) blockers.push(label);
    };
    await Promise.all([
      has(
        db.query.enrollment.findFirst({
          where: eq(schema.enrollment.userId, id),
          columns: { id: true },
        }),
        "enrollments",
      ),
      has(
        db.query.message.findFirst({
          where: eq(schema.message.senderId, id),
          columns: { id: true },
        }),
        "messages",
      ),
      has(
        db.query.cohort.findFirst({
          where: eq(schema.cohort.trainerId, id),
          columns: { id: true },
        }),
        "cohorts (as trainer)",
      ),
      has(
        db.query.assessmentResponse.findFirst({
          where: eq(schema.assessmentResponse.userId, id),
          columns: { id: true },
        }),
        "assessment responses",
      ),
      has(
        db.query.coachingBooking.findFirst({
          where: eq(schema.coachingBooking.trainerId, id),
          columns: { id: true },
        }),
        "coaching bookings",
      ),
      has(
        db.query.resource.findFirst({
          where: eq(schema.resource.uploadedById, id),
          columns: { id: true },
        }),
        "resources",
      ),
      has(
        db.query.seat.findFirst({
          where: or(
            eq(schema.seat.assignedUserId, id),
            eq(schema.seat.purchasedById, id),
          ),
          columns: { id: true },
        }),
        "seats",
      ),
      has(
        db.query.refund.findFirst({
          where: eq(schema.refund.processedById, id),
          columns: { id: true },
        }),
        "refunds",
      ),
      has(
        db.query.emailCampaign.findFirst({
          where: eq(schema.emailCampaign.sentById, id),
          columns: { id: true },
        }),
        "email campaigns",
      ),
      has(
        db.query.waitlistEntry.findFirst({
          where: eq(schema.waitlistEntry.userId, id),
          columns: { id: true },
        }),
        "waitlist entries",
      ),
    ]);
    if (blockers.length > 0) {
      throw new HttpError(
        409,
        `Cannot delete: this user is linked to ${blockers.join(", ")}. Deactivate the account instead.`,
      );
    }

    // Clean up owned auxiliary rows, preserve audit history (actor set to null), then delete.
    await db.transaction(async (tx) => {
      await tx
        .delete(schema.session)
        .where(
          or(
            eq(schema.session.userId, id),
            eq(schema.session.impersonatorId, id),
          ),
        );
      await tx.delete(schema.account).where(eq(schema.account.userId, id));
      await tx
        .delete(schema.notification)
        .where(eq(schema.notification.userId, id));
      await tx
        .delete(schema.consentRecord)
        .where(eq(schema.consentRecord.userId, id));
      await tx
        .delete(schema.membership)
        .where(eq(schema.membership.userId, id));
      await tx
        .delete(schema.threadMember)
        .where(eq(schema.threadMember.userId, id));
      await tx
        .delete(schema.verificationToken)
        .where(eq(schema.verificationToken.identifier, id));
      await tx
        .update(schema.auditLog)
        .set({ actorId: null })
        .where(eq(schema.auditLog.actorId, id));
      await tx.delete(schema.user).where(eq(schema.user.id, id));
    });
    await audit({
      actorId: principal.id,
      action: "user.delete",
      entity: "User",
      entityId: id,
      meta: { email: target.email, role: target.role },
    });
    res.json({ ok: true });
  }),
);

export default router;
