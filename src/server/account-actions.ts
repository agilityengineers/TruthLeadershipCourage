"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePrincipal } from "@/lib/session";
import { audit } from "@/lib/audit";

/** Record/withdraw a consent (GDPR). */
export async function setConsent(type: string, granted: boolean) {
  const principal = await requirePrincipal();
  await db.consentRecord.create({
    data: {
      userId: principal.id,
      type,
      grantedAt: granted ? new Date() : null,
      revokedAt: granted ? null : new Date(),
    },
  });
  await audit({ actorId: principal.id, action: granted ? "consent.grant" : "consent.revoke", entity: "User", entityId: principal.id, meta: { type } });
  revalidatePath("/portal/settings");
  return { ok: true as const };
}

/**
 * Right-to-erasure request. We mark the account and audit it; an admin completes
 * the erasure (anonymize PII) so we keep an auditable, reversible window rather
 * than hard-deleting financial/audit records inline.
 */
export async function requestAccountDeletion() {
  const principal = await requirePrincipal();
  await db.user.update({ where: { id: principal.id }, data: { status: "deletion_requested" } });
  await audit({ actorId: principal.id, action: "gdpr.deletion_request", entity: "User", entityId: principal.id });
  revalidatePath("/portal/settings");
  return { ok: true as const };
}
