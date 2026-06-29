import { db } from "./db";

/** Append an audit-log entry. GDPR/tenant traceability for sensitive actions. */
export async function audit(args: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: args.actorId ?? null,
        action: args.action,
        entity: args.entity,
        entityId: args.entityId,
        meta: args.meta as object | undefined,
        ip: args.ip,
      },
    });
  } catch (e) {
    // Never let audit logging break the primary action.
    console.error("[audit] failed", e);
  }
}
