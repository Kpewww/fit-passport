// Asking before any photo leaves for an AI service (Session 104).
//
// One yes per kind, recorded with the wording's version. The wording itself is in
// the `ai` messages (en/zh): who receives the photo, how long they keep it, that it
// is not used for training, and how to delete it. A face is in a try-on photo, so
// try-on has its own consent (China's PIPL treats a face as sensitive personal
// information; Illinois's BIPA asks for written consent and a retention limit).

import { prisma } from "../db";
import type { AiKind } from "./config";

/** Bump when the consent wording changes in a way people must agree to again. */
export const CONSENT_VERSION = "2026-10-24";

export async function hasConsent(userId: string, kind: AiKind): Promise<boolean> {
  const c = await prisma.aiConsent.findUnique({ where: { userId_kind: { userId, kind } }, select: { version: true } });
  return c?.version === CONSENT_VERSION;
}

export async function grantConsent(userId: string, kind: AiKind): Promise<void> {
  await prisma.aiConsent.upsert({
    where: { userId_kind: { userId, kind } },
    update: { version: CONSENT_VERSION, acceptedAt: new Date() },
    create: { userId, kind, version: CONSENT_VERSION },
  });
}

export async function revokeConsent(userId: string, kind: AiKind): Promise<void> {
  await prisma.aiConsent.deleteMany({ where: { userId, kind } });
}
