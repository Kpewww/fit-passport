"use client";

// The realistic body (Anny) for a 3D view that is not /body (Session 100: /check's fit
// map). Headless, as on a shop mannequin: faces are /body's to choose. Nothing loads
// until `enabled`; then the passport is read, Anny is fitted to it, cut at the neck
// and rounded, exactly as /body draws it with no face (BodyStudio.tsx).
//
// Height and weight are needed to fit Anny at all (bodyReadiness), so a passport
// without them answers "locked". Girths it lacks are left to Anny's own shape; they are
// for the drawing only and are never stored, sent or scored (invariant 98).

import { useEffect, useMemo, useState } from "react";
import { bodyReadiness, type Cup } from "@/lib/bodyView";
import type { AnnyData } from "@/lib/annyBody";
import type { BodyGeometryData } from "@/lib/fitMapColours";

type Profile = {
  sex?: string | null; heightCm?: number | null; weightKg?: number | null; chestCm?: number | null;
  waistCm?: number | null; hipCm?: number | null; shoulderCm?: number | null; inseamCm?: number | null;
};

export type RealisticBody =
  | { state: "off" | "loading" | "locked" | "error" }
  | { state: "ready"; body: BodyGeometryData; measurements: Record<string, number | string | null | undefined> };

type Libs = {
  anny: typeof import("@/lib/annyBody");
  cut: typeof import("@/lib/neckCut");
  pn: typeof import("@/lib/pnSubdivide");
  data: AnnyData;
};

export function useRealisticBody(enabled: boolean, look: { sex: "female" | "male" | null; cup: Cup | null }): RealisticBody {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [libs, setLibs] = useState<Libs | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || profile) return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile ?? {})).catch(() => setProfile({}));
  }, [enabled, profile]);

  const unlocked = profile != null && bodyReadiness(profile).level !== "locked";
  useEffect(() => {
    if (!enabled || !unlocked || libs) return;
    Promise.all([import("@/lib/annyBody"), import("@/lib/neckCut"), import("@/lib/pnSubdivide")])
      .then(async ([anny, cut, pn]) => setLibs({ anny, cut, pn, data: await anny.loadAnny() }))
      .catch(() => setFailed(true));
  }, [enabled, unlocked, libs]);

  const passportSex = profile?.sex === "male" || profile?.sex === "female" ? profile.sex : null;
  const sex: "female" | "male" = look.sex ?? passportSex ?? "female";
  const measurements = useMemo(() => ({
    heightCm: profile?.heightCm, weightKg: profile?.weightKg, chestCm: profile?.chestCm, waistCm: profile?.waistCm,
    hipCm: profile?.hipCm, shoulderCm: profile?.shoulderCm, inseamCm: profile?.inseamCm, sex,
  }), [profile, sex]);
  const cup = sex === "female" ? look.cup : null;

  const body = useMemo(() => {
    if (!enabled || !libs || !unlocked) return null;
    try {
      const fit = libs.anny.fitAnny(libs.data, { ...measurements, cup });
      return libs.pn.roundBody(libs.cut.cutAtNeck(fit.body, libs.data));
    } catch {
      return null;
    }
  }, [enabled, libs, unlocked, measurements, cup]);

  if (!enabled) return { state: "off" };
  if (failed) return { state: "error" };
  if (profile == null) return { state: "loading" };
  if (!unlocked) return { state: "locked" };
  if (!body) return libs ? { state: "error" } : { state: "loading" };
  return { state: "ready", body, measurements };
}
