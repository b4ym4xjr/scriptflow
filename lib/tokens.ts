import { createHash, randomBytes } from "crypto";

/** 256-bit random, URL-safe token (hex). */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * One-way hash for tokens that only need to be *verified* (email verification,
 * password reset). The raw token goes in the email; only this hash is stored,
 * so a database leak can't be turned into working reset/verify links.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cheap shape check so garbage input never reaches the database. */
export function isTokenFormat(token: unknown): token is string {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
