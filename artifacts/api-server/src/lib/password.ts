import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing using Node's built-in scrypt — no external dependency and no
 * native build step. Stored format: `scrypt$<saltHex>$<hashHex>`.
 *
 * Seeded/legacy demo accounts have a null `passwordHash` and continue to log in
 * with the shared demo password (see routes/session.ts); accounts created or
 * activated through the admin console carry a real hash verified here.
 */

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  const hashBuf = Buffer.from(hashHex, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}
