import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Onboarding form. Every measurement is optional — cold start is fine.
const ProfileSchema = z.object({
  sex: z.enum(["male", "female", "unspecified"]).nullable().optional(),
  shopsFor: z.string().max(40).nullable().optional(), // csv of mens/womens/unisex
  heightCm: z.coerce.number().min(80).max(260).nullable().optional(),
  weightKg: z.coerce.number().min(20).max(300).nullable().optional(),
  chestCm: z.coerce.number().min(50).max(200).nullable().optional(),
  waistCm: z.coerce.number().min(40).max(200).nullable().optional(),
  hipCm: z.coerce.number().min(40).max(200).nullable().optional(),
  shoulderCm: z.coerce.number().min(20).max(80).nullable().optional(),
  sleeveCm: z.coerce.number().min(20).max(100).nullable().optional(),
  inseamCm: z.coerce.number().min(40).max(120).nullable().optional(),
  preferredFit: z.enum(["slim", "regular", "relaxed", "oversized"]),
  region: z.enum(["US", "EU", "UK", "JP", "CN"]),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  const profile = await prisma.fitProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const profile = await prisma.fitProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  return NextResponse.json({ profile });
}
