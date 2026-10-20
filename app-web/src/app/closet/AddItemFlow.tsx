"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, Field, inputClass } from "@/components/ui";
import { CaretDown, Check, Close } from "@/components/Icon";
import { BrandInput } from "@/components/BrandInput";
import { SizeInput } from "@/components/SizeInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { GarmentIcon } from "@/components/GarmentIcon";
import { ColorPicker } from "@/components/ColorPicker";
import { PhotoSource } from "@/components/PhotoSource";
import { resizeGarmentPhoto } from "@/lib/imageResize";
import { FitDirectionInput } from "@/components/FitDirectionInput";
import { ratingFromDirection } from "@/lib/fitDirection";
import { ADD_STEPS, FLOW_STEPS, type AddStep, canSubmit, stepReady } from "@/lib/addFlow";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { SizeRow, GENDERS, BLANK } from "./shared";

export function AddItemFlow({
  onAdded,
  onClose,
  fromSaved = null,
  onFromSavedDone,
}: {
  onAdded: (id: string | null) => void;
  onClose?: () => void;
  /** A to-buy product being moved into the closet once bought (Session 80). */
  fromSaved?: string | null;
  onFromSavedDone?: () => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  const [form, setForm] = useState({ ...BLANK });
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  // Add-by-URL — offered on the first step as a shortcut, never as a gate.
  const [pasteUrl, setPasteUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  // The chart the extractor read, kept so the size the user picks can be stored
  // WITH the garment's own measurements. Before this the numbers were fetched,
  // shown once and thrown away — which is why a personal ease target in
  // centimetres was not computable. See docs/design/3d-body-and-tryon.md §8.
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([]);
  const [measuredFrom, setMeasuredFrom] = useState<string | null>(null);
  // Labels the page itself listed, offered as one-tap answers to the size question
  // (never chosen for the user), and the link, kept on the item it came from.
  const [sizeLabels, setSizeLabels] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [fromDemo, setFromDemo] = useState(false);

  // Moving a bought product in from the to-buy list: start from what was saved —
  // and from the stored check's chart, so the garment keeps its own measurements
  // for the size bought — then ask the size actually bought and how it fits.
  useEffect(() => {
    if (!fromSaved) return;
    let live = true;
    fetch(`/api/saved?id=${encodeURIComponent(fromSaved)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!live || !j?.item) return;
        const it = j.item;
        const measured = typeof j.measuredFrom === "string" && ["page", "brand-chart", "fixture", "seller"].includes(j.measuredFrom);
        setSizeRows(measured && Array.isArray(j.sizeRows) ? j.sizeRows : []);
        setMeasuredFrom(measured ? j.measuredFrom : null);
        setSizeLabels(Array.isArray(it.sizes) ? it.sizes : []);
        setProductUrl(it.url ?? null);
        setForm((f) => ({
          ...f,
          brand: it.brand || f.brand,
          displayName: it.productName || f.displayName,
          category: it.category || f.category,
          size: it.size || "",
        }));
        setExtractNote(t("fromSavedNote", { name: it.productName || it.brand || "" }));
        setStepIndex(it.brand && it.category ? ADD_STEPS.indexOf("size") : it.brand ? ADD_STEPS.indexOf("category") : 0);
      })
      .catch(() => {});
    return () => { live = false; };
  }, [fromSaved, t]);
  const [saveFailed, setSaveFailed] = useState(false);

  const step = FLOW_STEPS[stepIndex];
  const isLast = stepIndex === FLOW_STEPS.length - 1;
  // From the fit step on, the piece can be added: the colour-and-name step after it
  // is optional (Session 98, lib/addFlow.ts OPTIONAL_STEPS).
  const canAddHere = stepIndex >= ADD_STEPS.indexOf("fit");

  // Readiness and the blocking set live in lib/addFlow.ts so a test can hold
  // them to the FIC budget — a field is cheap to add and its cost is paid by
  // every user, every time.
  const ready = step === "details" ? true : stepReady(step as AddStep, form);
  const canAdd = canSubmit(form);

  // What has been answered so far, so the flow never loses the user's place.
  const trail = [
    stepIndex > 0 && form.brand.trim(),
    stepIndex > 1 && g.label(form.category),
    stepIndex > 2 && form.size,
  ].filter(Boolean).join(" · ");

  async function extractFromUrl() {
    if (!pasteUrl.trim()) return;
    setExtracting(true);
    setExtractNote(null);
    try {
      const r = await fetch("/api/closet/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: pasteUrl.trim() }),
      }).then((r) => r.json());
      // lib/closetExtract.ts decides what counts as read. A page we never saw
      // pre-fills nothing: the questions below are the whole flow, not a fallback.
      if (r.error || r.result !== "read") { setExtractNote(t("extractFailed")); return; }
      setSizeRows(Array.isArray(r.sizeRows) ? r.sizeRows : []);
      setMeasuredFrom(typeof r.measuredFrom === "string" ? r.measuredFrom : null);
      setSizeLabels(Array.isArray(r.sizeLabels) ? r.sizeLabels : []);
      setProductUrl(pasteUrl.trim());
      setFromDemo(r.demo === true);
      setForm((f) => ({
        ...f,
        brand: r.brand || f.brand,
        displayName: r.suggestedName || f.displayName,
        category: r.category || f.category,
        gender: r.gender || f.gender,
        size: "", // sizes are offered, never chosen for the user
      }));
      const bits = [r.brand, r.category && g.label(r.category)].filter(Boolean).join(" · ") || t("extractDetails");
      setExtractNote(r.demo ? t("extractDemo", { bits }) : t("extractRead", { bits, host: r.host ?? t("thePage") }));
      // The payoff for pasting a link is skipping the questions it answered — but
      // only the ones the PAGE answered. A category guessed from words in the URL
      // is pre-selected and still asked.
      if (r.brand && r.category && r.categoryFromPage) setStepIndex(ADD_STEPS.indexOf("size"));
      else if (r.brand) setStepIndex(ADD_STEPS.indexOf("category"));
    } catch {
      setExtractNote(t("extractFailed"));
    } finally {
      setExtracting(false);
    }
  }

  async function onPickImage(file: Blob | undefined) {
    if (!file) return;
    try {
      const dataUrl = await resizeGarmentPhoto(file);
      setForm((f) => ({ ...f, imageDataUrl: dataUrl }));
    } catch { /* ignore */ }
  }

  /**
   * The garment's own measurements for the size the user picked, if the chart we
   * read has a row for it. Sends nothing at all when it does not — a partial or
   * unattributed measurement is worse than none, and the API rejects a number
   * with no stated provenance.
   */
  function garmentMeasurementsFor(size: string): Record<string, unknown> {
    const row = sizeRows.find((r) => r.label === size);
    if (!row || !measuredFrom) return {};
    const has = row.chestCm != null || row.shoulderCm != null || row.sleeveCm != null || row.lengthCm != null;
    if (!has) return {};
    return {
      garmentChestCm: row.chestCm,
      garmentShoulderCm: row.shoulderCm,
      garmentSleeveCm: row.sleeveCm,
      garmentLengthCm: row.lengthCm,
      garmentMeasuredFrom: measuredFrom,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLast) {
      if (ready) { setJustAdded(null); setStepIndex(stepIndex + 1); }
      return;
    }
    await addNow();
  }

  async function addNow(src: typeof form = form) {
    if (!canAdd || saving) return;
    setSaving(true);
    setSaveFailed(false);
    const res = await fetch("/api/closet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brand: src.brand, displayName: src.displayName || null,
        category: src.category, gender: src.gender || null, size: src.size,
        fitRating: src.fitRating, fitDirection: src.fitDirection, color: src.color || null,
        onlineAvailable: src.onlineAvailable,
        ...garmentMeasurementsFor(src.size),
        productUrl: productUrl || undefined,
        fromSavedId: fromSaved || undefined,
        imageDataUrl: src.imageDataUrl || null,
        areaNotesJson: src.areaNotes ? JSON.stringify({ notes: src.areaNotes }) : null,
      }),
    }).catch(() => null);
    // Say "added" only when it was. The form stays filled on a failure, so
    // nothing the user typed is lost.
    if (!res || !res.ok) { setSaving(false); setSaveFailed(true); return; }
    setJustAdded(`${src.brand} ${g.label(src.category)} · ${src.size}`);
    setForm({ ...BLANK });
    setStepIndex(0);
    setShowDetails(false);
    setPasteUrl(""); setExtractNote(null);
    setSizeRows([]); setMeasuredFrom(null); setSizeLabels([]); setProductUrl(null); setFromDemo(false);
    setSaving(false);
    const created = await res.json().catch(() => null);
    if (fromSaved) onFromSavedDone?.();
    onAdded(typeof created?.item?.id === "string" ? created.item.id : null);
  }

  return (
    <Card>
      {justAdded && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-ok-tint px-3 py-2 text-sm text-ok">
          <Check size={16} className="flex-shrink-0" />
          <span>{t.rich("added", { b: (c) => <span className="font-medium">{c}</span> }, { item: justAdded })}</span>
        </p>
      )}

      {/* Where you are in the four questions. */}
      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            {t("stepOf", { n: stepIndex + 1, total: FLOW_STEPS.length })}
          </p>
          {trail && <p className="min-w-0 truncate text-[11px] text-ink-soft">{trail}</p>}
          {onClose && !trail && (
            <button type="button" onClick={onClose} className="-my-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-ink/5 hover:text-ink" aria-label={t("close")}>
              <Close size={16} />
            </button>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / FLOW_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* What the link gave us stays in view once the flow has moved past step 1 —
          a demo sample in particular must say so where its answers are used. */}
      {step !== "brand" && extractNote && (
        <p className="mb-4 text-[11px] text-ink-soft">{extractNote}</p>
      )}

      <form onSubmit={onSubmit}>
        <h3 className="text-base font-semibold text-ink">{t(`step.${step}.q`)}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">{t(`step.${step}.why`)}</p>

        <div className="mt-3">
          {step === "brand" && (
            <BrandInput value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
          )}
          {step === "category" && (
            <CategoryPicker
              inline
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v, size: "" })}
            />
          )}
          {step === "size" && (
            <>
              {sizeLabels.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-[11px] text-ink-faint">{fromDemo ? t("sizesInDemo") : t("sizesOnPage")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeLabels.map((l) => (
                      <Chip key={l} selected={form.size === l} onClick={() => setForm({ ...form, size: l })}>{l}</Chip>
                    ))}
                  </div>
                </div>
              )}
              <SizeInput category={form.category} value={form.size} onChange={(v) => setForm({ ...form, size: v })} line={form.gender} />
            </>
          )}
          {step === "fit" && (
            <FitDirectionInput
              value={form.fitDirection}
              onChange={(n) => setForm({ ...form, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
          )}
          {step === "details" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field as="div" label={t("color")}>
                <ColorPicker value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
              </Field>
              <Field label={t("name")}>
                <input className={inputClass} placeholder={t("namePlaceholder")}
                  value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </Field>
            </div>
          )}
        </div>

        {saveFailed && <p role="alert" className="mt-4 text-sm text-bad">{t("addFailed")}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStepIndex(stepIndex - 1)}>{t("back")}</Button>
          )}
          <Button type="submit" disabled={!ready || (isLast && (saving || !canAdd))}>
            {isLast ? (saving ? t("adding") : t("addToCloset")) : t("continue")}
          </Button>
          {/* The optional step is skippable from either side of it. */}
          {canAddHere && !isLast && (
            <Button type="button" variant="secondary" disabled={saving || !canAdd} onClick={() => { void addNow(); }}>
              {saving ? t("adding") : t("addNow")}
            </Button>
          )}
          {isLast && (
            <Button type="button" variant="ghost" disabled={saving || !canAdd} onClick={() => { void addNow({ ...form, color: "", displayName: "" }); }}>
              {t("skipAndAdd")}
            </Button>
          )}
        </div>

        {/* Everything the engine does not read. Reachable, not in the way. */}
        {isLast && (
          <div className="mt-5 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <CaretDown size={14} className={`transition-transform ${showDetails ? "rotate-180" : ""}`} />
              {showDetails ? t("hideDetails") : t("addDetails")}
            </button>
            <p className="mt-1 text-[11px] text-ink-faint">{t("detailsNote")}</p>

            {showDetails && (
              <div className="mt-3 grid gap-3 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <Field as="div" label={t("photo")} hint={t("photoHint")}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white text-xl text-ink-faint">
                        {form.imageDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.imageDataUrl} alt="" className="h-full w-full object-cover" />
                        ) : <GarmentIcon category={form.category} size={28} />}
                      </span>
                      <div className="min-w-0">
                        <PhotoSource onPick={(b) => onPickImage(b[0])} />
                        {form.imageDataUrl && <button type="button" onClick={() => setForm({ ...form, imageDataUrl: "" })} className="mt-1 text-xs text-ink-faint hover:text-bad">{t("removePhoto")}</button>}
                      </div>
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("lineLabel")} hint={t("optional")}>
                    <select className={inputClass} value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      {GENDERS.map((v) => <option key={v} value={v}>{g.line(v)}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("fitNotes")} hint={t("optional")}>
                    <input className={inputClass} placeholder={t("notesPlaceholder")}
                      value={form.areaNotes} onChange={(e) => setForm({ ...form, areaNotes: e.target.value })} />
                  </Field>
                </div>
                <div className="flex items-center sm:col-span-6">
                  <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <input type="checkbox" checked={!form.onlineAvailable} className="accent-brand"
                      onChange={(e) => setForm({ ...form, onlineAvailable: !e.target.checked })} />
                    {t("inStoreOnly")}
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
      {/* The shortcut sits on the first step only — it answers the first
          questions, so offering it later would be offering to redo them. Below the
          question, not above it (Session 100): first on the page, it read as the
          question itself. */}
      {step === "brand" && (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-paper-soft p-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            {t("haveLink")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass + " min-w-0 flex-1"}
              placeholder={t("pastePlaceholder")}
              aria-label={t("pastePlaceholder")}
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
            />
            <Button type="button" variant="secondary" size="md" onClick={extractFromUrl} disabled={extracting || !pasteUrl.trim()}>
              {extracting ? t("reading") : t("autofill")}
            </Button>
          </div>
          {extractNote && <p className="mt-1.5 text-[11px] text-ink-soft">{extractNote}</p>}
        </div>
      )}

    </Card>
  );
}

