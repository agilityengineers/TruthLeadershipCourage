import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing using Node's built-in scrypt — no external dependency and no
 * native build step. Stored format: `scrypt$<saltHex>$<hashHex>`.
 *
 * Every account authenticates against its own stored hash. Accounts with a null
 * `passwordHash` have no password set and cannot sign in until they set one
 * through the invite / set-password flow (`verifyPassword` returns false for a
 * missing hash). Passwords are minted only via the admin console / invite path.
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
