"use client";

// The /outfits preview on the 3D body (Session 100): the realistic body, headless, in
// the colour chosen on /body, wearing each piece's colour where it covers
// (lib/outfitColours.ts). Without height and weight it draws an average body and
// says so. Loaded only when the 3D view is chosen.

import { Suspense, lazy, useEffect, useState } from "react";
import Link from "next/link";
import { SafeBoundary } from "@/components/SafeBoundary";
import { useRealisticBody } from "@/components/useRealisticBody";
import { layerHex, type OutfitLayer } from "@/components/OutfitMannequin";
import { readBodyLook, toneHex, type BodyLook } from "@/lib/bodyView";
import { coverFor } from "@/lib/outfitColours";
import { useT } from "@/i18n/client";

const FitMap3D = lazy(() => import("@/components/FitMap3D").then((m) => ({ default: m.FitMap3D })));

export function OutfitBody3D({ layers, size = 300 }: { layers: OutfitLayer[]; size?: number }) {
  const t = useT("outfits");
  const [look, setLook] = useState<BodyLook | null>(null);
  useEffect(() => setLook(readBodyLook("real")), []);
  const real = useRealisticBody(look != null, { sex: look?.sex ?? null, cup: look?.cup ?? null }, { average: true });
  const box = { width: size, height: size };

  if (real.state === "error") return <p className="flex items-center px-6 text-center text-xs text-ink-faint" style={box}>{t("view3dCantStart")}</p>;
  if (real.state !== "ready" || !look) return <div className="animate-pulse rounded-2xl bg-paper-dim" style={box} aria-label={t("view3dLoading")} />;
  // As on the flat mannequin, what the outfit leaves out is drawn in a neutral default
  // (a light top, grey trousers, dark shoes), so one piece still reads as a figure.
  const covers = new Set(layers.map((l) => coverFor(l.category)));
  const has = (...c: string[]) => c.some((x) => covers.has(x as never));
  const filled = [
    ...(!has("top-short", "top-long", "dress", "onepiece") ? [{ category: "tshirt", color: null }] : []),
    ...(!has("bottom-long", "bottom-short", "skirt", "dress", "onepiece") ? [{ category: "pants", color: null }] : []),
    ...(!has("shoe") ? [{ category: "shoes", color: null }] : []),
    ...layers,
  ];
  const outfit = filled.map((l) => ({ category: l.category, colour: layerHex(l.category, l.color) }));
  return (
    <div className="flex flex-col items-center gap-2">
      <SafeBoundary fallback={<p className="flex items-center px-6 text-center text-xs text-ink-faint" style={box}>{t("view3dCantStart")}</p>}>
        <Suspense fallback={<div className="animate-pulse rounded-2xl bg-paper-dim" style={box} />}>
          <FitMap3D size={size} measurements={real.measurements} body={real.body} outfit={outfit} tint={toneHex(look.tone, look.undertone)} skin={look.tone !== "form"} />
        </Suspense>
      </SafeBoundary>
      {real.average && (
        <p className="max-w-[16rem] text-center text-[11px] text-ink-faint">
          {t("view3dAverage")} <Link href="/passport?edit=1&focus=measurements" className="font-medium text-brand hover:underline">{t("view3dAddMine")}</Link>
        </p>
      )}
    </div>
  );
}
