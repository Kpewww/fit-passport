"use client";

// Closet photos from the database to the private store (Session 100g, admin only).
// A batch per press until none are left; old photos keep working until moved.

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { useT } from "@/i18n/client";

export function MovePhotos() {
  const t = useT("admin");
  const [s, setS] = useState<{ storeOn: boolean; inDatabase: number; inStore: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const load = useCallback(() => {
    fetch("/api/admin/photos").then((r) => (r.ok ? r.json() : null)).then(setS).catch(() => {});
  }, []);
  useEffect(load, [load]);
  if (!s) return null;
  async function move() {
    setBusy(true); setNote(null);
    let total = 0, failed = 0;
    // Batches until done, so one press moves them all on a small closet.
    for (let i = 0; i < 40; i++) {
      const r = await fetch("/api/admin/photos", { method: "POST" }).catch(() => null);
      const j = r?.ok ? await r.json() : null;
      if (!j) break;
      total += j.moved; failed += j.failed;
      if (j.left === 0 || j.moved === 0) break;
    }
    setBusy(false);
    setNote(t("photos.done", { n: total, failed }));
    load();
  }
  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink">{t("photos.title")}</h2>
      <Card className="mt-3 !p-4">
        <p className="text-xs text-ink-soft">{s.storeOn ? t("photos.on", { db: s.inDatabase, store: s.inStore }) : t("photos.off")}</p>
        {s.storeOn && s.inDatabase > 0 && (
          <Button className="mt-3" size="sm" disabled={busy} onClick={move}>{busy ? t("photos.moving") : t("photos.move", { n: s.inDatabase })}</Button>
        )}
        {note && <p className="mt-2 text-sm text-ink">{note}</p>}
      </Card>
    </section>
  );
}
