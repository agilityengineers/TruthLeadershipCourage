import { db } from "./db";

/** Issue a completion certificate (idempotent) for a finished enrollment. */
export async function issueCertificate(enrollmentId: string) {
  const existing = await db.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;
  const serial = `TLC-${new Date().getFullYear()}-${enrollmentId.slice(-6).toUpperCase()}`;
  return db.certificate.create({ data: { enrollmentId, serial } });
}
