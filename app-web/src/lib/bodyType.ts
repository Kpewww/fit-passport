// Body-type derivation — multi-dimensional, transparent, and respectful.
//
// Founder's ask: subdivide body type on more than one axis, show the user an
// illustrative figure of "which body type you are," and have an honest
// out-of-scope path when a body falls outside what a given garment's size
// ladder can serve (rather than confidently returning a bad size).
//
// Two axes, both optional and gracefully degrading:
//   1. VOLUME  — a size band derived from BMI when height+weight are known.
//                Bands are wide and NON-JUDGMENTAL labels; we never editorialize.
//   2. SHAPE   — torso taper from chest vs waist (or hip) when known:
//                "tapered" (V), "straight", or "full-waist".
//
// The result also carries an `inScope` flag + reason. This is deliberately
// conservative: it does NOT diagnose anything, it only says "our size charts
// may not cover this body well." All thresholds live here so they're auditable.

export type VolumeBand = "petite" | "lean" | "average" | "solid" | "broad" | "extended";
export type TorsoShape = "tapered" | "straight" | "full-waist" | "unknown";

export type BodyTypeResult = {
  // A short human label combining the axes, e.g. "Average · tapered".
  label: string;
  volume: VolumeBand | null; // null when height/weight missing
  shape: TorsoShape;
  bmi: number | null;
  // A stable key for the illustrative figure component.
  figureKey: VolumeBand | "unknown";
  // Scope: false when the body is outside what standard size ladders serve well.
  inScope: boolean;
  scopeNote: string | null;
  // Which axes we could actually compute (for the UI to show "add X to refine").
  have: { volume: boolean; shape: boolean };
};

export type BodyMeasurements = {
  heightCm?: number | null;
  weightKg?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
};

// Volume bands by BMI. Bands are broad; labels are neutral. The two ends
// (petite / extended) trigger the "may be out of scope for a given line" note,
// because mainstream S–XXL ladders often don't cover those bodies well.
function volumeFromBmi(bmi: number): VolumeBand {
  if (bmi < 17) return "petite";
  if (bmi < 20) return "lean";
  if (bmi < 25) return "average";
  if (bmi < 28) return "solid";
  if (bmi < 33) return "broad";
  return "extended";
}

function shapeFromTorso(
  chestCm?: number | null,
  waistCm?: number | null,
  hipCm?: number | null,
): TorsoShape {
  const ref = waistCm ?? hipCm;
  if (chestCm == null || ref == null) return "unknown";
  const drop = chestCm - ref; // positive = chest wider than waist (V-taper)
  if (drop >= 12) return "tapered";
  if (drop <= 2) return "full-waist";
  return "straight";
}

const VOLUME_LABEL: Record<VolumeBand, string> = {
  petite: "Petite",
  lean: "Lean",
  average: "Average",
  solid: "Solid",
  broad: "Broad",
  extended: "Extended",
};

const SHAPE_LABEL: Record<TorsoShape, string> = {
  tapered: "tapered",
  straight: "straight",
  "full-waist": "full-waist",
  unknown: "",
};

export function deriveBodyType(m: BodyMeasurements): BodyTypeResult {
  const { heightCm, weightKg } = m;
  const haveVolume = heightCm != null && weightKg != null && heightCm > 0;
  const bmi = haveVolume ? weightKg! / Math.pow(heightCm! / 100, 2) : null;
  const volume = bmi != null ? volumeFromBmi(bmi) : null;
  const shape = shapeFromTorso(m.chestCm, m.waistCm, m.hipCm);

  // Scope check — the extreme volume bands are where standard alpha ladders
  // (S–XXL) stop serving the body well. We phrase this as a sizing limitation of
  // the CHART, never a judgment of the person.
  let inScope = true;
  let scopeNote: string | null = null;
  if (volume === "extended") {
    inScope = false;
    scopeNote =
      "Your measurements sit above the range most standard S–XXL size charts cover. " +
      "Recommendations may be unreliable for lines that stop at XXL — look for extended-size ranges, and treat any pick here as approximate.";
  } else if (volume === "petite") {
    inScope = false;
    scopeNote =
      "Your measurements sit below the range most standard adult size charts cover. " +
      "Petite or XS-focused ranges will fit far better than a standard S — treat picks here as approximate.";
  }

  const label =
    volume != null
      ? `${VOLUME_LABEL[volume]}${shape !== "unknown" ? ` · ${SHAPE_LABEL[shape]}` : ""}`
      : shape !== "unknown"
        ? `${SHAPE_LABEL[shape][0].toUpperCase()}${SHAPE_LABEL[shape].slice(1)} build`
        : "Not enough data yet";

  return {
    label,
    volume,
    shape,
    bmi: bmi != null ? Math.round(bmi * 10) / 10 : null,
    figureKey: volume ?? "unknown",
    inScope,
    scopeNote,
    have: { volume: haveVolume, shape: shape !== "unknown" },
  };
}
