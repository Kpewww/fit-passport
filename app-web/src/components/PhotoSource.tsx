"use client";

// Every way a closet photo can arrive — Session 88c.
//
// Upload was the only way in. The founder asked for screenshots too, in all three
// forms: paste one from the clipboard (a system screenshot, then Cmd+V), capture the
// screen from inside the page (the browser asks which tab or window to share; one
// frame is taken and the stream stops at once), or take a photo with a phone camera.
// Each ends as a Blob handed to the caller, which resizes it like any upload.
//
// Nothing here is uploaded or stored: the caller decides. A screen capture never
// leaves the browser as video — one still frame, cropped by the person, is all that
// survives.

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "@/components/Icon";
import { useT } from "@/i18n/client";

type Props = {
  onPick: (blobs: Blob[]) => void;
  /** Batch adding takes several pictures at once. */
  multiple?: boolean;
  /** Listen for Cmd/Ctrl+V on the whole page while this is on screen. Default true. */
  listenForPaste?: boolean;
  className?: string;
};

const chip =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink transition-colors hover:border-ink/40 focus-within:ring-2 focus-within:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

function imagesFrom(list: DataTransferItemList | FileList | null | undefined): Blob[] {
  if (!list) return [];
  const out: Blob[] = [];
  for (let i = 0; i < list.length; i++) {
    const entry = list[i] as DataTransferItem | File;
    const file = "getAsFile" in entry ? (entry.kind === "file" ? entry.getAsFile() : null) : entry;
    if (file && file.type.startsWith("image/")) out.push(file);
  }
  return out;
}

export function PhotoSource({ onPick, multiple = false, listenForPaste = true, className = "" }: Props) {
  const t = useT("closet");
  const [note, setNote] = useState<string | null>(null);
  const [frame, setFrame] = useState<string | null>(null);
  const [canCapture, setCanCapture] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setCanCapture(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia);
    setTouch(typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches);
  }, []);

  const give = useCallback(
    (blobs: Blob[]) => {
      if (!blobs.length) return;
      setNote(null);
      onPick(multiple ? blobs : blobs.slice(0, 1));
    },
    [multiple, onPick],
  );

  // Cmd/Ctrl+V anywhere on the page, unless the person is typing in a field.
  useEffect(() => {
    if (!listenForPaste) return;
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const blobs = imagesFrom(e.clipboardData?.items);
      if (blobs.length) {
        e.preventDefault();
        give(blobs);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [give, listenForPaste]);

  async function pasteButton() {
    try {
      const items = await navigator.clipboard.read();
      const blobs: Blob[] = [];
      for (const item of items) {
        const type = item.types.find((ty) => ty.startsWith("image/"));
        if (type) blobs.push(await item.getType(type));
      }
      if (blobs.length) give(blobs);
      else setNote(t("photoPasteEmpty"));
    } catch {
      // Not every browser lets a page read the clipboard on a click; the keyboard
      // paste above always works.
      setNote(t("photoPasteKeys"));
    }
  }

  async function capture() {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      setFrame(canvas.toDataURL("image/png"));
    } catch {
      setNote(t("photoCaptureFailed"));
    } finally {
      stream?.getTracks().forEach((tr) => tr.stop());
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${chip} cursor-pointer`}>
          <Camera size={16} />
          {t("photoUpload")}
          <input type="file" accept="image/*" multiple={multiple} className="sr-only"
            onChange={(e) => { give(imagesFrom(e.target.files)); e.target.value = ""; }} />
        </label>
        <button type="button" className={chip} onClick={pasteButton}>{t("photoPaste")}</button>
        {canCapture && !touch && <button type="button" className={chip} onClick={capture}>{t("photoCapture")}</button>}
        {touch && (
          <label className={`${chip} cursor-pointer`}>
            {t("photoCamera")}
            <input type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => { give(imagesFrom(e.target.files)); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">{note ?? t("photoPasteHint")}</p>
      {frame && (
        <CropBox
          src={frame}
          onCancel={() => setFrame(null)}
          onDone={(blob) => { setFrame(null); give([blob]); }}
        />
      )}
    </div>
  );
}

/**
 * Drag a box over the captured frame. The box is drawn by writing its style
 * directly during the drag (never a state update per pointer move); the numbers
 * are read once, on "Use this part".
 */
function CropBox({ src, onCancel, onDone }: { src: string; onCancel: () => void; onDone: (b: Blob) => void }) {
  const t = useT("closet");
  const imgRef = useRef<HTMLImageElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const rect = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [hasBox, setHasBox] = useState(false);

  function point(e: React.PointerEvent) {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: Math.min(Math.max(e.clientX - r.left, 0), r.width), y: Math.min(Math.max(e.clientY - r.top, 0), r.height) };
  }
  function draw() {
    const b = boxRef.current, r = rect.current;
    if (!b || !r) return;
    b.style.left = `${r.x}px`; b.style.top = `${r.y}px`; b.style.width = `${r.w}px`; b.style.height = `${r.h}px`;
    b.style.display = "block";
  }
  function down(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    start.current = point(e);
    rect.current = { ...start.current, w: 0, h: 0 };
    draw();
  }
  function move(e: React.PointerEvent) {
    if (!start.current) return;
    const p = point(e), s = start.current;
    rect.current = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) };
    requestAnimationFrame(draw);
  }
  function up() {
    start.current = null;
    setHasBox(!!rect.current && rect.current.w > 8 && rect.current.h > 8);
  }

  function finish(whole: boolean) {
    const img = imgRef.current!;
    const scale = img.naturalWidth / img.getBoundingClientRect().width;
    const r = !whole && rect.current && hasBox ? rect.current : { x: 0, y: 0, w: img.getBoundingClientRect().width, h: img.getBoundingClientRect().height };
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(r.w * scale);
    canvas.height = Math.round(r.h * scale);
    canvas.getContext("2d")?.drawImage(img, r.x * scale, r.y * scale, r.w * scale, r.h * scale, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b && onDone(b), "image/png");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-ink/80 p-4" role="dialog" aria-modal="true" aria-label={t("cropTitle")}>
      <p className="text-sm font-medium text-white">{t("cropHint")}</p>
      <div className="relative max-h-[75vh] max-w-full touch-none select-none" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src={src} alt="" draggable={false} className="block max-h-[75vh] max-w-full" />
        <div ref={boxRef} className="pointer-events-none absolute hidden border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => finish(false)} disabled={!hasBox}
          className="h-10 rounded-full bg-white px-4 text-sm font-medium text-ink disabled:opacity-40">{t("cropUse")}</button>
        <button type="button" onClick={() => finish(true)} className="h-10 rounded-full bg-white/15 px-4 text-sm font-medium text-white">{t("cropWhole")}</button>
        <button type="button" onClick={onCancel} className="h-10 rounded-full px-4 text-sm font-medium text-white/80">{t("cancel")}</button>
      </div>
    </div>
  );
}
