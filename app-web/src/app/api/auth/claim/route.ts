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

  // Membership number. SQLite only allows autoincrement on a primary key, so we
  // take max+1 and let the unique constraint reject the (very rare) race — then
  // retry. Numbers are for CLAIMED accounts: it's a membership number, and an
  // anonymous session isn't a membership yet.
  const updated = await claimWithMemberNo(user.id, {
    accountCode,
    username,
    email,
    passwordHash,
    bodyType: bodyType ?? null,
    showBodyType: showBodyType ?? true,
    exportPolicy: exportPolicy ?? "owner",
  });

  setSession({ userId: updated.id, canEdit: true });

  return NextResponse.json({
    accountCode: updated.accountCode,
    username: updated.username,
    memberNo: updated.memberNo,
    hasEmail: !!email,
  });
}

type ClaimData = {
  accountCode: string;
  username: string;
  email: string | null;
  passwordHash: string;
  bodyType: string | null;
  showBodyType: boolean;
  exportPolicy: string;
};

async function claimWithMemberNo(userId: string, data: ClaimData) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const max = await prisma.user.aggregate({ _max: { memberNo: true } });
    const memberNo = (max._max.memberNo ?? 0) + 1;
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          claimed: true,
          memberNo,
          // recoveryHash column stays in the schema for now; explicitly cleared
          // so any leftover from a previous flow doesn't linger.
          recoveryHash: null,
          ...data,
        },
      });
    } catch (err) {
      // Only a memberNo collision is worth retrying; anything else is a real error.
      const code = (err as { code?: string })?.code;
      if (code !== "P2002" || attempt === 4) throw err;
    }
  }
  throw new Error("could not allocate a member number");
}
