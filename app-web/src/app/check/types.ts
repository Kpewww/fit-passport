// The shapes /check's parts share (Session 100, when the page was split into files).

import type { Zone } from "@/lib/fitMapColours";
import type { Judgement } from "@/lib/listingJudgement";

export type SizeScore = {
  label: string;
  normalized: string | null;
  score: number;
  confidence: number;
  reasons: Array<{ signal: string; weight: number; message: string; itemId?: string }>;
  verdict?: "too small" | "snug" | "true to size" | "relaxed" | "too big";
  /** How this size sits on each measured part (Session 97). */
  zones?: Zone[];
};

export type SizeOption = {
  label: string;
  region: string | null;
  chestCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  lengthCm: number | null;
  bodyChestMinCm: number | null;
  bodyChestMaxCm: number | null;
  waistCm?: number | null;
  bodyWaistMinCm?: number | null;
  bodyWaistMaxCm?: number | null;
  hipCm?: number | null;
  bodyHipMinCm?: number | null;
  bodyHipMaxCm?: number | null;
};

export type Product = {
  id: string;
  url: string;
  retailer: string | null;
  brand: string | null;
  productName: string | null;
  category: string | null;
  material: string | null;
  fitNotes: string | null;
  sizeOptions: SizeOption[];
};

export type Source = {
  url: string;
  host: string;
  derived: boolean;
  slug?: string;
  sizesFrom?: "fixture" | "page" | "brand-chart" | "seller" | "estimated";
  chart?: { sourceUrl: string; capturedAt: string };
  measurementKind?: "body" | "garment";
  measurementKindFrom?: "page" | "table" | "brand";
  /** "extension" = the page came from the user's own browser, not our fetch. */
  fetch?: "ok" | "blocked" | "unreachable" | "skipped" | "extension";
  /** Which reader produced page sizes — a table, or a model reading text/images. */
  extractedBy?: "table" | "llm-text" | "llm-vision" | "picked-picture" | "uploaded-picture" | "hao-xing" | "seller-title" | "seller-specs" | "seller-description" | "seller-typed";
};

export type Body = {
  chestCm: number | null;
  waistCm: number | null;
  shoulderCm: number | null;
  hipCm?: number | null;
  heightCm?: number | null;
  inseamCm?: number | null;
  sex?: "male" | "female" | null;
  estimated: boolean;
};

export type CheckResponse = {
  product: Product;
  source: Source;
  body?: Body;
  result: {
    ranked: SizeScore[];
    best: SizeScore;
    explanation: string;
    /** Nothing separated the sizes — `best` is ladder order, not a pick. */
    undetermined?: boolean;
    domainNote: string | null;
    domainRelevance: "match" | "cross" | "empty";
    conflictNote: string | null;
    /** Does the pick survive plausible measurement error? See lib/stability.ts. */
    stability?: {
      agreement: number;
      runs: number;
      holdsForChestCm: [number, number] | null;
      bodyNoiseCm: number;
      chartNoiseCm: number;
    } | null;
    /** A one-off listing's judgement (Session 80): present instead of a ranking. */
    judgement?: Judgement;
  };
  effectiveFit: FitPref;
  /** Absent when a stored check is reopened (`?product=`) — that is a recompute. */
  recommendationId?: string;
};

export type Status = { hasBody: boolean; hasChest: boolean; closetCount: number; accuracy: "low" | "medium" | "high"; claimed?: boolean; department?: "mens" | "womens" | null };

export type FitPref = "slim" | "regular" | "relaxed" | "oversized";
