import { db, schema, eq, and, isNull, sql } from "./db";

/** ---- Audit log ---------------------------------------------------------- */
export async function audit(args: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  /** When the actor's session is impersonated, the admin driving it. */
  impersonatorId?: string | null;
}) {
  try {
    const meta = args.impersonatorId
      ? { ...(args.meta ?? {}), impersonatorId: args.impersonatorId }
      : args.meta;
    await db.insert(schema.auditLog).values({
      actorId: args.actorId ?? null,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId ?? null,
      meta: (meta as object) ?? null,
      ip: args.ip ?? null,
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}

/** ---- Notifications ------------------------------------------------------ */
type NotificationType = typeof schema.notification.$inferInsert["type"];

export async function notify(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}) {
  await db.insert(schema.notification).values({
    userId: args.userId,
    type: args.type ?? "GENERIC",
    title: args.title,
    body: args.body ?? null,
    href: args.href ?? null,
    channel: "in_app",
  });
}

export async function notifyMany(
  userIds: string[],
  base: { type: NotificationType; title: string; body?: string; href?: string },
) {
  if (userIds.length === 0) return;
  await db.insert(schema.notification).values(
    userIds.map((userId) => ({
      userId,
      type: base.type ?? "GENERIC",
      title: base.title,
      body: base.body ?? null,
      href: base.href ?? null,
      channel: "in_app",
    })),
  );
}

/** ---- Email (simulated stub — records intent, never sends) ---------------- */
export function renderTemplate(tpl: string, data: Record<string, string | number>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => String(data[key] ?? ""));
}

export async function sendEmail(args: { to: string | string[]; subject: string; html: string }) {
  const to = Array.isArray(args.to) ? args.to.join(",") : args.to;
  console.info(`[email:sim] to=${to} subject="${args.subject}"`);
  return { mocked: true as const };
}

/** ---- Certificate -------------------------------------------------------- */
export async function issueCertificate(enrollmentId: string) {
  const existing = await db.query.certificate.findFirst({
    where: eq(schema.certificate.enrollmentId, enrollmentId),
  });
  if (existing) return existing;
  const serial = `TLC-${new Date().getFullYear()}-${enrollmentId.slice(-6).toUpperCase()}`;
  const [cert] = await db.insert(schema.certificate).values({ enrollmentId, serial }).returning();
  return cert;
}

/** ---- Coupon evaluation -------------------------------------------------- */
export type CouponResult =
  | { valid: true; discountCents: number; couponId: string }
  | { valid: false; reason: string };

export async function evaluateCoupon(code: string, baseCents: number, cohortId?: string): Promise<CouponResult> {
  const coupon = await db.query.coupon.findFirst({
    where: eq(schema.coupon.code, code.trim().toUpperCase()),
  });
  if (!coupon || !coupon.active) return { valid: false, reason: "Invalid code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: "Expired" };
  if (coupon.cohortId && cohortId && coupon.cohortId !== cohortId)
    return { valid: false, reason: "Not valid for this cohort" };
  if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions)
    return { valid: false, reason: "Redemption limit reached" };
  const discount =
    coupon.type === "PERCENT"
      ? Math.round((baseCents * Math.min(coupon.value, 100)) / 100)
      : Math.min(coupon.value, baseCents);
  return { valid: true, discountCents: discount, couponId: coupon.id };
}

/** ---- Assessment snapshot ------------------------------------------------ */
export type QuestionLite = { id: string; theme: string; pillar: string; color: string; prompt: string; benefit: string };
export type Snapshot = { growth: Array<{ theme: string; benefit: string; pillar: string; color: string }>; strengths: string[] };
const PILLAR_COLOR: Record<string, string> = { EQ: "#024794", IQ: "#262161", MQ: "#662d91" };

export function computeSnapshot(questions: QuestionLite[], answers: Record<string, number>): Snapshot {
  const growth: Snapshot["growth"] = [];
  const strengths: string[] = [];
  for (const q of questions) {
    const v = answers[q.id] ?? 0;
    if (v > 0 && v <= 2) {
      growth.push({ theme: q.theme, benefit: q.benefit, pillar: q.pillar, color: q.color || PILLAR_COLOR[q.pillar] || "#024794" });
    } else if (v >= 3) {
      strengths.push(q.theme);
    }
  }
  return { growth, strengths };
}

export { PILLAR_COLOR };

/** ---- Chat threads wiring (idempotent) ----------------------------------- */
export async function ensureChatThreads(cohortId: string, userId: string, trainerId: string | null) {
  let channel = await db.query.thread.findFirst({
    where: and(eq(schema.thread.cohortId, cohortId), eq(schema.thread.type, "COHORT_CHANNEL")),
  });
  if (!channel) {
    const cohort = await db.query.cohort.findFirst({ where: eq(schema.cohort.id, cohortId) });
    [channel] = await db
      .insert(schema.thread)
      .values({ type: "COHORT_CHANNEL", cohortId, title: `${cohort?.name ?? "Cohort"} channel` })
      .returning();
  }
  const inChannel = await db.query.threadMember.findFirst({
    where: and(eq(schema.threadMember.threadId, channel!.id), eq(schema.threadMember.userId, userId)),
  });
  if (!inChannel) await db.insert(schema.threadMember).values({ threadId: channel!.id, userId });

  if (trainerId) {
    const existing = await db
      .select({ id: schema.thread.id })
      .from(schema.thread)
      .where(
        and(
          eq(schema.thread.type, "DIRECT"),
          sql`exists (select 1 from ${schema.threadMember} tm where tm.thread_id = ${schema.thread.id} and tm.user_id = ${userId})`,
          sql`exists (select 1 from ${schema.threadMember} tm where tm.thread_id = ${schema.thread.id} and tm.user_id = ${trainerId})`,
        ),
      );
    if (existing.length === 0) {
      const [t] = await db.insert(schema.thread).values({ type: "DIRECT" }).returning();
      await db.insert(schema.threadMember).values([
        { threadId: t.id, userId },
        { threadId: t.id, userId: trainerId },
      ]);
    }
  }
}

export { isNull };
