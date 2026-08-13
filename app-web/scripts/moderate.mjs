#!/usr/bin/env node
// Operator takedown/restore tool.
//
// There is no admin role in the app yet, and inventing one (with the auth surface
// that implies) is worse than a CLI you have to hold the database credentials to
// run. Auto-hiding from reports is only a stopgap; THIS is the authoritative
// path — it's how a wrongly-hidden post gets restored, and how something nobody
// reported but that clearly has to go gets removed.
//
//   node scripts/moderate.mjs reports              # open reports, most-reported first
//   node scripts/moderate.mjs show POST <id>       # one item + who reported it
//   node scripts/moderate.mjs hide POST <id>       # take down
//   node scripts/moderate.mjs unhide POST <id>     # restore
//   node scripts/moderate.mjs delete POST <id>     # remove permanently
//
// kind = POST | ANSWER | OUTFIT

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const KINDS = ["POST", "ANSWER", "OUTFIT"];

const model = (kind) =>
  kind === "POST" ? prisma.post : kind === "ANSWER" ? prisma.answer : prisma.outfit;

function bail(msg) {
  console.error(msg);
  process.exit(1);
}

async function listReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    select: { kind: true, targetId: true, reason: true, note: true, createdAt: true },
  });
  if (reports.length === 0) return console.log("No reports.");

  // Group by target so one badly-behaved item shows as one row, not five.
  const byTarget = new Map();
  for (const r of reports) {
    const key = `${r.kind}:${r.targetId}`;
    const g = byTarget.get(key) ?? { ...r, count: 0, reasons: new Set(), notes: [] };
    g.count += 1;
    g.reasons.add(r.reason);
    if (r.note) g.notes.push(r.note);
    byTarget.set(key, g);
  }

  const rows = [...byTarget.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [key, g] of rows) {
    const [kind, id] = key.split(":");
    const row = await model(kind).findUnique({
      where: { id },
      select: { hidden: true, userId: true },
    });
    console.log(
      `${g.count}×  ${kind.padEnd(6)} ${id}  ${row?.hidden ? "[HIDDEN]" : "[visible]"}  ` +
        `${[...g.reasons].join(",")}${g.notes.length ? `  notes: ${g.notes.join(" | ")}` : ""}`,
    );
  }
}

async function show(kind, id) {
  const row = await model(kind).findUnique({
    where: { id },
    include: { user: { select: { username: true, accountCode: true } } },
  });
  if (!row) bail(`No ${kind} with id ${id}`);
  console.log(JSON.stringify(row, null, 2));
  const reports = await prisma.report.findMany({ where: { kind, targetId: id } });
  console.log(`\n${reports.length} report(s):`);
  for (const r of reports) console.log(`  ${r.reason}${r.note ? ` — ${r.note}` : ""}`);
}

async function setHidden(kind, id, hidden) {
  const row = await model(kind).findUnique({ where: { id }, select: { id: true } });
  if (!row) bail(`No ${kind} with id ${id}`);
  await model(kind).update({ where: { id }, data: { hidden } });
  console.log(`${kind} ${id} is now ${hidden ? "HIDDEN" : "VISIBLE"}.`);
}

async function remove(kind, id) {
  const row = await model(kind).findUnique({ where: { id }, select: { id: true } });
  if (!row) bail(`No ${kind} with id ${id}`);
  // An accepted answer is referenced by its post; clear that first or the post
  // ends up pointing at a row that no longer exists.
  if (kind === "ANSWER") {
    await prisma.post.updateMany({ where: { resolvedAnswerId: id }, data: { resolvedAnswerId: null } });
  }
  await prisma.report.deleteMany({ where: { kind, targetId: id } });
  await model(kind).delete({ where: { id } });
  console.log(`${kind} ${id} deleted.`);
}

const [cmd, kindArg, id] = process.argv.slice(2);
const kind = kindArg?.toUpperCase();

try {
  if (cmd === "reports") await listReports();
  else if (["show", "hide", "unhide", "delete"].includes(cmd)) {
    if (!KINDS.includes(kind) || !id) bail(`Usage: node scripts/moderate.mjs ${cmd} <${KINDS.join("|")}> <id>`);
    if (cmd === "show") await show(kind, id);
    else if (cmd === "hide") await setHidden(kind, id, true);
    else if (cmd === "unhide") await setHidden(kind, id, false);
    else await remove(kind, id);
  } else {
    console.log(
      [
        "Fit Passport moderation",
        "",
        "  node scripts/moderate.mjs reports",
        "  node scripts/moderate.mjs show   <POST|ANSWER|OUTFIT> <id>",
        "  node scripts/moderate.mjs hide   <POST|ANSWER|OUTFIT> <id>",
        "  node scripts/moderate.mjs unhide <POST|ANSWER|OUTFIT> <id>",
        "  node scripts/moderate.mjs delete <POST|ANSWER|OUTFIT> <id>",
      ].join("\n"),
    );
  }
} finally {
  await prisma.$disconnect();
}
