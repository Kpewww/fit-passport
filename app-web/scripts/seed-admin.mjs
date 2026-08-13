#!/usr/bin/env node
// Seeds the founder/admin account and backfills membership numbers.
//
//   node scripts/seed-admin.mjs                  # default username AK
//   ADMIN_USERNAME=AK ADMIN_PASSWORD=… node scripts/seed-admin.mjs
//
// This is the ONLY way an account becomes an admin or gets `grantAllBadges`.
// There is deliberately no API for either: an endpoint that can mint admins is an
// endpoint that can be abused into minting admins, and this app has no second
// factor to fall back on.
//
// Idempotent — re-running updates the account in place rather than duplicating it.
//
// `grantAllBadges` presents the whole prestige ladder for demos. It does NOT fake
// the stats: computeBadgeStats still returns the truth, so nothing about the
// engine or the leaderboard is distorted. Real accounts earn badges or don't.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERNAME = process.env.ADMIN_USERNAME ?? "AK";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "12345678";

const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // must match src/lib/auth.ts
function generateAccountCode() {
  let out = "";
  for (let i = 0; i < 13; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `FP-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 13)}`;
}

// A believable starter wardrobe: several brands, a couple of sizes each, honest
// fit ratings (not all 5 — a closet where everything is perfect teaches the
// engine nothing).
const COLLECTIONS = [
  { name: "Everyday", color: "sky" },
  { name: "Tailoring", color: "slate" },
  { name: "Outerwear", color: "emerald" },
  { name: "Denim", color: "indigo" },
];

const ITEMS = [
  { c: "Everyday", brand: "Uniqlo", category: "tshirt", gender: "mens", size: "M", fitRating: 5, color: "navy", notes: "the reference tee" },
  { c: "Everyday", brand: "Uniqlo", category: "tshirt", gender: "mens", size: "L", fitRating: 3, color: "white", notes: "too boxy through the body" },
  { c: "Everyday", brand: "COS", category: "sweater", gender: "mens", size: "M", fitRating: 4, color: "oatmeal" },
  { c: "Everyday", brand: "Muji", category: "shirt", gender: "mens", size: "M", fitRating: 4, color: "sky" },
  { c: "Tailoring", brand: "COS", category: "shirt", gender: "mens", size: "EU 48", fitRating: 4, color: "white", notes: "sleeves a touch long" },
  { c: "Tailoring", brand: "Suitsupply", category: "blazer", gender: "mens", size: "46", fitRating: 5, color: "charcoal" },
  { c: "Tailoring", brand: "Theory", category: "trousers", gender: "mens", size: "32", fitRating: 4, color: "black" },
  { c: "Outerwear", brand: "Patagonia", category: "jacket", gender: "mens", size: "M", fitRating: 5, color: "black", notes: "true across the back" },
  { c: "Outerwear", brand: "Arc'teryx", category: "jacket", gender: "mens", size: "M", fitRating: 4, color: "grey" },
  { c: "Outerwear", brand: "Uniqlo", category: "coat", gender: "mens", size: "L", fitRating: 3, color: "camel", notes: "shoulders sit wide" },
  { c: "Denim", brand: "Levi's", category: "jeans", gender: "mens", size: "32", fitRating: 5, color: "indigo" },
  { c: "Denim", brand: "A.P.C.", category: "jeans", gender: "mens", size: "31", fitRating: 4, color: "raw denim", notes: "stretches half a size" },
];

const OUTFITS = [
  {
    title: "Charcoal blazer, white tee",
    description: "The default. Works for a pitch and for dinner after it.",
    occasion: "Work",
    items: [
      { brand: "Suitsupply", category: "blazer", color: "charcoal", size: "46" },
      { brand: "Uniqlo", category: "tshirt", color: "white", size: "M" },
      { brand: "Theory", category: "trousers", color: "black", size: "32" },
    ],
  },
  {
    title: "Raw denim and a black shell",
    description: "Cold-weather uniform. The Patagonia runs true across the back.",
    occasion: "Weekend",
    items: [
      { brand: "Patagonia", category: "jacket", color: "black", size: "M" },
      { brand: "COS", category: "sweater", color: "oatmeal", size: "M" },
      { brand: "A.P.C.", category: "jeans", color: "raw denim", size: "31" },
    ],
  },
];

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: USERNAME } });
  const passwordHash = await bcrypt.hash(PASSWORD, 10); // same cost as lib/auth.ts

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          claimed: true,
          passwordHash,
          role: "ADMIN",
          grantAllBadges: true,
          deactivated: false,
          listedInCommunity: true,
          bodyType: "athletic",
          showBodyType: true,
          accountCode: existing.accountCode ?? generateAccountCode(),
        },
      })
    : await prisma.user.create({
        data: {
          username: USERNAME,
          passwordHash,
          claimed: true,
          role: "ADMIN",
          grantAllBadges: true,
          listedInCommunity: true,
          bodyType: "athletic",
          showBodyType: true,
          accountCode: generateAccountCode(),
        },
      });

  // ---- profile ----
  await prisma.fitProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      sex: "male",
      shopsFor: "mens,unisex",
      heightCm: 178,
      weightKg: 72,
      chestCm: 97,
      waistCm: 81,
      shoulderCm: 45,
      sleeveCm: 62,
      inseamCm: 80,
      preferredFit: "regular,slim",
      region: "US",
      notes: "Broad-ish shoulders for the chest measurement; sleeves usually run long.",
    },
    update: {
      sex: "male",
      shopsFor: "mens,unisex",
      heightCm: 178,
      weightKg: 72,
      chestCm: 97,
      waistCm: 81,
      shoulderCm: 45,
      preferredFit: "regular,slim",
      region: "US",
    },
  });

  // ---- closet (reset so re-running doesn't pile up) ----
  await prisma.knownGoodItem.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });

  const collectionIds = {};
  for (const [i, c] of COLLECTIONS.entries()) {
    const row = await prisma.collection.create({
      data: { userId: user.id, name: c.name, color: c.color, sortIndex: i },
    });
    collectionIds[c.name] = row.id;
  }
  for (const [i, it] of ITEMS.entries()) {
    await prisma.knownGoodItem.create({
      data: {
        userId: user.id,
        collectionId: collectionIds[it.c],
        brand: it.brand,
        category: it.category,
        gender: it.gender,
        size: it.size,
        fitRating: it.fitRating,
        color: it.color,
        sortIndex: i,
        areaNotesJson: it.notes ? JSON.stringify({ notes: it.notes }) : null,
      },
    });
  }

  // ---- outfits ----
  await prisma.outfit.deleteMany({ where: { userId: user.id } });
  for (const o of OUTFITS) {
    await prisma.outfit.create({
      data: {
        userId: user.id,
        title: o.title,
        description: o.description,
        occasion: o.occasion,
        items: {
          create: o.items.map((it, i) => ({
            brand: it.brand,
            category: it.category,
            color: it.color,
            size: it.size,
            sortIndex: i,
          })),
        },
      },
    });
  }

  // ---- one seed question, so the Questions section isn't empty in a demo ----
  const askTitle = "Which brands run true on broad shoulders for a 97cm chest?";
  const already = await prisma.post.findFirst({ where: { userId: user.id, title: askTitle } });
  if (!already) {
    await prisma.post.create({
      data: {
        userId: user.id,
        kind: "RECOMMEND",
        title: askTitle,
        body:
          "My Patagonia M sits true across the back but a Uniqlo L in the same category " +
          "goes wide in the shoulders. Which brands cut a 97cm chest without the extra width?",
      },
    });
  }

  // ---- membership numbers ----
  // The founder is member 1; everyone else is numbered by when they joined.
  await prisma.user.update({ where: { id: user.id }, data: { memberNo: null } });
  const others = await prisma.user.findMany({
    where: { claimed: true, id: { not: user.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  // Clear first, so re-running can't collide with numbers it assigned last time.
  await prisma.user.updateMany({ where: { claimed: true }, data: { memberNo: null } });
  await prisma.user.update({ where: { id: user.id }, data: { memberNo: 1 } });
  for (const [i, u] of others.entries()) {
    await prisma.user.update({ where: { id: u.id }, data: { memberNo: i + 2 } });
  }

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(
    [
      "",
      "  Admin account ready",
      "  ───────────────────",
      `  username     ${fresh.username}`,
      `  password     ${PASSWORD}`,
      `  account code ${fresh.accountCode}`,
      `  member no.   No. ${String(fresh.memberNo).padStart(8, "0")}`,
      `  role         ${fresh.role}   (review queue at /admin)`,
      `  badges       all shown as earned (grantAllBadges)`,
      `  seeded       ${ITEMS.length} closet items · ${COLLECTIONS.length} collections · ${OUTFITS.length} outfits · 1 question`,
      `  numbered     ${others.length + 1} claimed accounts`,
      "",
      "  Log in at /login with the username and password above.",
      "",
    ].join("\n"),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
