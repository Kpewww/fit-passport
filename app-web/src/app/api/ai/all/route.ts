// DELETE /api/ai/all — every AI photo of this person: try-on body photos, try-on
// results and closet cut-outs (Session 104). Original closet photos are untouched.

import { NextResponse } from "next/server";
import { aiUser } from "@/lib/aiMedia/http";
import { deleteAllAiPhotos } from "@/lib/aiMedia/service";

export async function DELETE() {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ ok: true, deleted: await deleteAllAiPhotos(user.id) });
}
