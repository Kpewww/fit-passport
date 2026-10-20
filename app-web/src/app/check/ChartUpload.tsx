"use client";

// "Only have a size chart?" (Session 100): a picture of the chart, chosen or pasted,
// sized without a product page. The case: a school's swag form links two charts as
// pictures on Google Drive. The picture is scaled down here (1600 px on its longest
// side, JPEG) before it is sent, and only it is sent — with the garment type and the
// link if the shopper gives them. The server keeps what it read, not the picture.

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { Camera, Close } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { PICKABLE_CATEGORIES } from "@/lib/garments";

export type ChartUploadInput = { data: string; link?: string };

const MAX_SIDE = 1600;

/** A picture as base64 JPEG, at most MAX_SIDE on its longest side, on white. */
async function shrink(file: Blob): Promise<{ data: string; preview: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // a transparent PNG's background, as the chart was printed
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.9);
  return { data: url.slice(url.indexOf(",") + 1), preview: url };
}

export function ChartUpload({
  busy,
  onSubmit,
  startOpen = false,
}: {
  busy: boolean;
  onSubmit: (upload: ChartUploadInput, category: string | undefined) => void;
  startOpen?: boolean;
}) {
  const t = useT("check");
  const g = useGarmentText();
  const [open, setOpen] = useState(startOpen);
  const [pic, setPic] = useState<{ data: string; preview: string } | null>(null);
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [bad, setBad] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const take = async (file: Blob | null | undefined) => {
    setBad(false);
    if (!file || !file.type.startsWith("image/")) { if (file) setBad(true); return; }
    try { setPic(await shrink(file)); } catch { setBad(true); }
  };

  // Paste anywhere on the page while the panel is open: a screenshot of the chart.
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (item) { e.preventDefault(); void take(item.getAsFile()); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-soft hover:bg-white hover:text-ink"
      >
        <Camera size={16} /> {t("upload.open")}
      </button>
    );
  }

  return (
    <Card className="mx-auto mt-6 max-w-xl text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 text-ink">{t("upload.title")}</h2>
          <p className="mt-1 text-sm text-ink-soft">{t("upload.intro")}</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("upload.close")} className="text-ink-faint hover:text-ink">
          <Close size={18} />
        </button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void take(e.dataTransfer.files?.[0]); }}
        className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-paper-soft px-4 py-6 text-center"
      >
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pic.preview} alt={t("upload.previewAlt")} className="max-h-56 rounded-lg ring-1 ring-line" />
        ) : (
          <p className="text-sm text-ink-soft">{t("upload.drop")}</p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="secondary" icon={<Camera size={16} />} onClick={() => fileRef.current?.click()}>
            {pic ? t("upload.another") : t("upload.choose")}
          </Button>
        </div>
        <p className="text-[11px] text-ink-faint">{t("upload.paste")}</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void take(e.target.files?.[0])} />
      </div>
      {bad && <p role="alert" className="mt-2 text-sm text-bad">{t("upload.notAPicture")}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-ink-soft">{t("upload.kind")}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none"
          >
            <option value="">{t("upload.kindLater")}</option>
            {PICKABLE_CATEGORIES.map((c) => <option key={c} value={c}>{g.label(c)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("upload.link")}
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={t("upload.linkPlaceholder")}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none"
          />
        </label>
      </div>

      <p className="mt-4 text-[11px] text-ink-faint">{t("upload.privacy")}</p>
      <div className="mt-3">
        <Button disabled={!pic || busy} onClick={() => pic && onSubmit({ data: pic.data, link: link.trim() || undefined }, category || undefined)}>
          {busy ? t("reading") : t("upload.submit")}
        </Button>
      </div>
    </Card>
  );
}
