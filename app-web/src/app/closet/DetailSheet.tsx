"use client";

import { useEffect, useState } from "react";
import { Button, FitStars } from "@/components/ui";
import { Basket, Check, Close, Note, Pencil, Trash } from "@/components/Icon";
import { GarmentIcon } from "@/components/GarmentIcon";
import { PhotoSource } from "@/components/PhotoSource";
import { colorHex, iconToneOn } from "@/lib/colors";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { Item, Collection, Group, ColorDot, safeNotes, itemName, fmtWhen, GarmentMeasurements, ConfirmDelete, MoveMenu } from "./shared";
import { EditRow } from "./EditRow";

export function DetailSheet({
  group,
  collections,
  inBucket,
  onBucket,
  onClose,
  onReload,
  onPatch,
  onPhoto,
  onRemove,
}: {
  group: Group;
  collections: Collection[];
  inBucket: (id: string) => boolean;
  onBucket: (it: Item) => void;
  onClose: () => void;
  onReload: () => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onPhoto: (id: string, file: Blob | null) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  const head = group.items[0];
  const name = itemName(head, g.label);
  // Which item (if any) is being edited inline, right here in the sheet.
  const [editId, setEditId] = useState<string | null>(null);
  const editItem = editId ? group.items.find((it) => it.id === editId) ?? null : null;
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const hex = colorHex(head.color);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function photo(file: Blob | null | undefined) {
    if (file === undefined) return;
    if (file && !file.type.startsWith("image/")) { setFailed(true); return; }
    setBusy(true);
    setFailed(false);
    try { await onPhoto(head.id, file); } catch { setFailed(true); } finally { setBusy(false); }
  }

  const history = (() => {
    try {
      const arr = JSON.parse(head.editHistory || "[]");
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [];
    }
  })();
  const lastEdited = history.length ? history[history.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow text-ink-faint">{g.label(head.category)}</p>
            <h3 className="mt-1 truncate text-h3 font-semibold text-ink">{name}</h3>
          </div>
          <button onClick={onClose} className="-mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label={t("close")}>
            <Close size={20} />
          </button>
        </div>

        {/* Inline editor lives right inside the file — no bouncing to the list */}
        {editItem ? (
          <div className="px-5 py-5">
            <EditRow
              item={editItem}
              collections={collections}
              onCancel={() => setEditId(null)}
              onSaved={() => { setEditId(null); onReload(); }}
            />
          </div>
        ) : (
          <>
            {/* The cover. Drop a photo on it, or use the button. Only the
                wearer's own photos — never a retailer's image (principle ③). */}
            <div className="px-5 pt-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); photo(e.dataTransfer.files?.[0]); }}
                className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl transition-shadow ${dragging ? "ring-2 ring-brand" : "ring-1 ring-line"}`}
                style={{ backgroundColor: head.imageDataUrl ? "#E6E7E9" : hex ?? "#E6E7E9" }}
              >
                {head.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={head.imageDataUrl} alt={t("yourPhotoAlt", { name })} className="h-full w-full object-cover" />
                ) : (
                  <GarmentIcon category={head.category} size={80} className={iconToneOn(hex) === "light" ? "text-white/80" : "text-ink/45"} />
                )}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-r-transparent" aria-label={t("savingPhoto")} />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Not while editing: the edit form has its own photo control and
                    a paste would land in both. */}
                {!editId && <PhotoSource onPick={(b) => photo(b[0])} />}
                {head.imageDataUrl && (
                  <Button size="sm" variant="ghost" icon={<Trash size={16} />} onClick={() => photo(null)}>{t("remove")}</Button>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                {failed ? <span className="text-bad">{t("photoFileFailed")}</span> : t("photoNote")}
              </p>
            </div>

            <div className="flex items-start gap-4 px-5 py-5">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-ink">{head.brand}</p>
                <p className="text-ink-soft">{g.label(head.category)}{head.gender ? ` · ${g.line(head.gender)}` : ""}</p>
                <FitStars rating={head.fitRating} size={14} />
              </div>
              {!group.isVariant && (
                <div className="ml-auto flex flex-shrink-0 flex-col items-end gap-2">
                  <Button size="sm" variant="secondary" icon={<Pencil size={16} />} onClick={() => setEditId(head.id)}>{t("edit")}</Button>
                  <ConfirmDelete label={t("deleteThis")} onConfirm={() => onRemove(head.id)} />
                </div>
              )}
            </div>

            {/* variants OR single size */}
            <div className="border-t border-line px-5 py-4">
              <p className="eyebrow mb-2 text-ink-faint">
                {group.isVariant ? t("nVariants", { n: group.items.length }) : t("details")}
              </p>
              <div className="space-y-1.5">
                {group.items.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm ring-1 ring-line">
                    <span className="flex items-center gap-2">
                      <ColorDot color={v.color} />
                      <span className="font-medium text-ink">{t("sizeN", { size: v.size })}</span>
                      {v.color && <span className="text-ink-faint">· {g.color(v.color)}</span>}
                    </span>
                    <span className="flex items-center gap-3 text-xs">
                      <button onClick={() => setEditId(v.id)} className="text-ink-soft hover:text-ink">{t("edit")}</button>
                      <ConfirmDelete label={t("remove")} onConfirm={() => onRemove(v.id)} variant="link" />
                    </span>
                  </div>
                ))}
              </div>
              <GarmentMeasurements item={head} />
              {head.areaNotesJson && safeNotes(head.areaNotesJson) && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-paper-soft px-3 py-2 text-xs text-ink-soft"><Note size={14} className="mt-px flex-shrink-0" />{safeNotes(head.areaNotesJson)}</p>
              )}
            </div>

            {/* timestamps: created · last modified · edit history */}
            <div className="border-t border-line px-5 py-4 text-xs">
              <p className="eyebrow mb-2 text-ink-faint">{t("history")}</p>
              <dl className="space-y-1 text-ink-soft">
                <div className="flex justify-between"><dt className="text-ink-faint">{t("created")}</dt><dd>{fmtWhen(head.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-faint">{t("lastModified")}</dt><dd>{lastEdited ? fmtWhen(lastEdited) : t("never")}</dd></div>
              </dl>
              {history.length > 1 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-ink-faint hover:text-ink">{t("nEdits", { n: history.length })}</summary>
                  <ul className="mt-1 space-y-0.5 border-l border-line pl-3 text-ink-faint">
                    {history.slice().reverse().map((when, i) => (
                      <li key={i}>{fmtWhen(when)}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            {/* actions */}
            <div className="mt-auto space-y-3 border-t border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <MoveMenu collections={collections} currentId={head.collectionId} onMove={(cid) => onPatch(head.id, { collectionId: cid })} />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={inBucket(head.id) ? <Check size={16} /> : <Basket size={16} />}
                  className={inBucket(head.id) ? "!border-brand !text-brand" : ""}
                  onClick={() => onBucket(head)}
                >
                  {inBucket(head.id) ? t("inBucket") : t("addToBucket")}
                </Button>
              </div>
              <p className="text-[11px] text-ink-faint">{t("privateNote")}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

