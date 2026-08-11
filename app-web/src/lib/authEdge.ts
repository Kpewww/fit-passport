// Edge-runtime-safe session signing (Web Crypto), byte-compatible with the
// Node implementation in auth.ts. Used by middleware.ts, which runs on the Edge
// runtime and therefore cannot use Node's `crypto` module.
//
// Both sides compute HMAC-SHA256 over the same base64url(JSON) body with the
// same secret, so a cookie signed here verifies with decodeSession() in auth.ts
// and vice versa.

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "fit-passport-dev-secret-change-me";

export const SESSION_COOKIE = "fp_session";

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8ToBase64url(s: string): string {
  return base64url(new TextEncoder().encode(s));
}

async function signEdge(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64url(new Uint8Array(sig));
}

export type EdgeSessionPayload = { userId: string; canEdit: boolean };

/** Encode + sign a session payload (matches Node encodeSession output). */
export async function encodeSessionEdge(payload: EdgeSessionPayload): Promise<string> {
  const body = utf8ToBase64url(JSON.stringify(payload));
  return `${body}.${await signEdge(body)}`;
}

/** Verify a cookie's signature (constant-ish time). Returns payload or null. */
export async function decodeSessionEdge(
  cookie: string | undefined,
): Promise<EdgeSessionPayload | null> {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot < 0) return null;
  const body = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  if ((await signEdge(body)) !== sig) return null;
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(
        atob(body.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      ),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
