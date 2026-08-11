// POST /api/auth/claim
//   body: { username, password, email?, bodyType?, exportPolicy? }
// Upgrades the current anonymous account into a claimed, shareable one:
// assigns a high-entropy account code, sets username + hashed password, and
// (optionally) a recovery email. Recovery codes were removed for UX reasons —
// if the user provides an email, forgot-password uses it; otherwise they're
// told plainly that a lost password means a lost account.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, setSession } from "@/lib/session";
import { generateAccountCode, hashSecret } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(2).max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "letters, numbers, and . _ - only")
    // A username must NOT look like an email — otherwise it'd collide with
    // email-based login. (No "@", and not a bare "name@domain.tld" shape.)
    .refine((u) => !u.includes("@") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u), {
      message: "username can't be an email address",
    }),
  password: z.string().min(6).max(200),
  email: z.string().email().max(200).optional().or(z.literal("")),
  bodyType: z
    .enum(["petite", "slim", "lean", "average", "athletic", "curvy", "broad", "tall", "plus"])
    .optional(),
  showBodyType: z.boolean().optional(),
  exportPolicy: z.enum(["owner", "anyone"]).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user.claimed) {
    return NextResponse.json({ error: "account already claimed" }, { status: 409 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { username, password, bodyType, showBodyType, exportPolicy } = parsed.data;
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    return NextResponse.json({ error: "username taken" }, { status: 409 });
  }
  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json({ error: "email already in use" }, { status: 409 });
    }
  }

  let accountCode = generateAccountCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.user.findUnique({ where: { accountCode } });
    if (!clash) break;
    accountCode = generateAccountCode();
  }

  const passwordHash = await hashSecret(password);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      claimed: true,
      accountCode,
      username,
      email,
      passwordHash,
      // recoveryHash column stays in the schema for now; explicitly cleared
      // so any leftover from a previous flow doesn't linger.
      recoveryHash: null,
      bodyType: bodyType ?? null,
      showBodyType: showBodyType ?? true,
      exportPolicy: exportPolicy ?? "owner",
    },
  });

  setSession({ userId: updated.id, canEdit: true });

  return NextResponse.json({
    accountCode: updated.accountCode,
    username: updated.username,
    hasEmail: !!email,
  });
}
