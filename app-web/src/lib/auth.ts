// Auth primitives for code-based identity.
// See docs/design/identity-and-sharing.md for the threat model.
//
//  - account code : high-entropy public bearer capability (READ closet + coarse body)
//  - password     : bcrypt-hashed edit credential (WRITE); "login" = verify password
//  - session       : signed (HMAC-SHA256) cookie carrying userId + whether the
//                     holder has edit rights on that account.

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

// --- secret for signing session cookies ---
// In production this MUST come from the environment: without it, anyone could
// forge a session cookie and read/write any account. We therefore FAIL FAST on a
// production build that hasn't set it, rather than silently running insecure.
// Locally we fall back to a fixed dev secret so `npm run dev` needs zero setup.
const DEV_SECRET = "fit-passport-dev-secret-change-me";

// Resolved per call, NOT at module load: `next build` runs with
// NODE_ENV=production but doesn't need the secret, so throwing at import time
// would break the build. This way a misconfigured deployment fails loudly on the
// first request that actually touches a session.
function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))" ` +
        "and set it in your deployment environment.",
    );
  }
  return DEV_SECRET;
}

export const SESSION_COOKIE = "fp_session";

// ---------- account codes ----------

// Crockford-ish base32 (no I/L/O/U to avoid confusion). ~5 bits/char.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate a human-shareable account code like "FP-7QK4-9WPX-3M2QT" with ~65
 * bits of entropy across 13 significant chars. High-entropy so codes can't be
 * enumerated; grouped for readability.
 */
export function generateAccountCode(): string {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 13; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  // FP-XXXX-XXXX-XXXXX
  return `FP-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 13)}`;
}

/** Normalize a user-typed code (case, spaces, missing prefix) for lookup. */
export function normalizeAccountCode(raw: string): string {
  let s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!s.startsWith("FP-")) s = s.replace(/^FP/, "").replace(/^-/, "");
  // Re-add prefix if the user dropped it.
  if (!s.startsWith("FP-")) s = `FP-${s.replace(/^-/, "")}`;
  return s;
}

/** A short, friendly recovery code shown once at signup. */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${out.slice(0, 5)}-${out.slice(5, 10)}`;
}

// ---------- password hashing ----------

export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, 10);
}

export async function verifySecret(secret: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(secret, hash);
}

// ---------- signed session cookies ----------

export type SessionPayload = {
  userId: string;
  // true when this session authenticated with the password (edit rights).
  canEdit: boolean;
};

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

/** Encode + sign a session payload into a cookie string. */
export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify + decode a cookie string. Returns null if tampered or malformed. */
export function decodeSession(cookie: string | undefined): SessionPayload | null {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot < 0) return null;
  const body = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = sign(body);
  // Constant-time compare.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

// ---------- carrying a session to the new address (Session 92) ----------
//
// The old address signs a pass for the session it holds; the new address checks it
// and keeps the session as its own cookie (lib/sessionCarry.ts has the flow). The
// signature covers "carry." + body, so a pass can never be used as a session cookie
// and a session cookie can never be used as a pass. A pass is bound to the browser
// that asked for it (`state`, a random value only that browser holds in a cookie)
// and dies after CARRY_TTL_MS.

export const CARRY_TTL_MS = 60_000;

export type CarryPass = SessionPayload & { state: string; exp: number };

export function encodeCarryPass(session: SessionPayload, state: string, now = Date.now()): string {
  const pass: CarryPass = { userId: session.userId, canEdit: session.canEdit, state, exp: now + CARRY_TTL_MS };
  const body = Buffer.from(JSON.stringify(pass)).toString("base64url");
  return `${body}.${sign(`carry.${body}`)}`;
}

/** The session a pass carries, or null if it is forged, expired or for another browser. */
export function decodeCarryPass(pass: string | null | undefined, state: string | null | undefined, now = Date.now()): SessionPayload | null {
  if (!pass || !state) return null;
  const dot = pass.lastIndexOf(".");
  if (dot < 0) return null;
  const body = pass.slice(0, dot);
  const a = Buffer.from(pass.slice(dot + 1));
  const b = Buffer.from(sign(`carry.${body}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let p: Partial<CarryPass>;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof p.userId !== "string" || typeof p.canEdit !== "boolean" || typeof p.exp !== "number") return null;
  if (p.exp < now || p.state !== state) return null;
  return { userId: p.userId, canEdit: p.canEdit };
}
