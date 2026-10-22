// POST /api/feedback  { message, contact?, path? }
// What someone tells us from the "Feedback" link on every page (Session 100). Kept in
// the database (the admin page lists it) and, when email is set up, sent to the team.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { say } from "@/lib/apiText";
import { emailConfigured, sendEmail } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/siteContact";
import { track } from "@/lib/events";
import { localeFromRequest } from "@/i18n/request";

const Body = z.object({
  message: z.string().trim().min(2).max(4000),
  contact: z.string().trim().max(200).optional(),
  path: z.string().max(500).optional(),
});

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "feedback"), 8, 60 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", message: say(req, "Write a few words first.") }, { status: 400 });
  const { message, contact, path } = parsed.data;
  const userId = (await readSession())?.userId ?? null;
  const locale = localeFromRequest(req);
  await prisma.feedback.create({ data: { userId, message, contact: contact || null, path: path ?? null, locale } });
  void track("feedback", { userId, path });
  if (emailConfigured() && CONTACT_EMAIL) {
    void sendEmail({
      to: CONTACT_EMAIL,
      subject: `Fit Passport feedback${path ? ` — ${path}` : ""}`,
      html: `<p>${esc(message).replace(/\n/g, "<br>")}</p><p>Contact: ${esc(contact || "—")}<br>Page: ${esc(path || "—")}<br>Language: ${locale}</p>`,
    });
  }
  return NextResponse.json({ ok: true });
}
