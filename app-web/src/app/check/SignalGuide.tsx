"use client";

import { Check } from "@/components/Icon";
import { LinkButton } from "@/components/ui";
import { CONFIDENCE_WEIGHTS } from "@/lib/confidenceWeights";
import { useT } from "@/i18n/client";
import type { Status } from "./types";

// An honest "how good is this answer, and how do I improve it" panel. The engine
// is transparent by design, so we say plainly what it does and doesn't know yet.
export function SignalGuide({
  status,
  hasResult,
  confidence,
  undetermined,
}: {
  status: Status;
  hasResult: boolean;
  /** The confidence of the answer just given, 0..1. Undefined before any check. */
  confidence?: number;
  /** True when nothing separated the sizes — see EngineOutput.undetermined. */
  undetermined?: boolean;
}) {
  // The numbers below come from the engine's own confidence arithmetic, not from
  // copywriting — see CONFIDENCE_WEIGHTS, which is the same constant the scorer
  // adds.
  //
  // "up to" is load-bearing, and was corrected before shipping: the raw sum then
  // passes through six caps and multipliers (cross-domain, report consistency,
  // top-2 margin, signal agreement, and two hard caps), every one of which can
  // only SHRINK it. A flat "+35" would have been an overclaim, and a test caught
  // it — a bare floor case measures 0.18, not the 0.30 the constant alone implies.
  const t = useT("check");
  const pts = (w: number) => t("guide.upTo", { n: Math.round(w * 100) });

  const steps = [
    {
      // Gated on the CHEST, not on hasBody. The points below are only ever
      // awarded for a chest (computeConfidence), so ticking this for someone who
      // entered a waist would quietly withdraw an offer that is still open.
      done: status.hasChest,
      key: "chest",
      label: status.hasBody ? t("guide.chestLabelMore") : t("guide.chestLabelAll"),
      why: t("guide.chestWhy", { pts: pts(CONFIDENCE_WEIGHTS.measurements) }),
      href: "/onboarding",
      cta: status.hasBody ? t("guide.chestCtaMore") : t("guide.chestCtaAll"),
    },
    {
      done: status.closetCount >= 3,
      key: "closet",
      label: t("guide.closetLabel"),
      why: t("guide.closetWhy", { pts: pts(CONFIDENCE_WEIGHTS.closetAnchor) }),
      href: "/closet",
      cta: t("guide.closetCta"),
      progress: status.closetCount > 0 ? t("guide.closetProgress", { n: status.closetCount }) : undefined,
    },
    {
      done: !!status.claimed,
      key: "account",
      label: t("guide.accountLabel"),
      why: t("guide.accountWhy"),
      href: "/account",
      cta: t("guide.accountCta"),
    },
  ];
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="border-b border-line bg-paper-soft px-6 py-4">
        <p className="eyebrow text-ink-faint">
          {undetermined
            ? t("guide.eyebrowUndetermined")
            : hasResult
              ? t("guide.eyebrowResult")
              : t("guide.eyebrowBefore")}
        </p>
        {/* The invitation is grounded in the answer just given. Generic copy here
            would waste the one moment the person can actually SEE what the missing
            evidence costs them — which is the whole argument for letting a first
            check run on an empty profile. */}
        <h3 className="mt-2 font-serif text-2xl leading-tight text-ink">
          {undetermined
            ? t("guide.titleUndetermined")
            : confidence != null
              ? t("guide.titleConfidence", { pct: Math.round(confidence * 100) })
              : status.closetCount === 0 && !status.hasBody
                ? t("guide.titleGuessing")
                : t("guide.titleMissing")}
        </h3>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          {undetermined
            ? t("guide.bodyUndetermined")
            : confidence != null
              // The floor from the engine's own constant, so the sentence cannot drift from it.
              ? t("guide.bodyConfidence", { floor: Math.round(CONFIDENCE_WEIGHTS.floor * 100) })
              : status.closetCount === 0 && !status.hasBody
                ? t("guide.bodyGuessing")
                : t("guide.bodyMissing")}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-4 px-6 py-4">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                s.done ? "bg-ok text-white" : "bg-paper-dim text-ink-faint"
              }`}
            >
              {s.done && <Check size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-ink-faint line-through" : "text-ink"}`}>
                {s.label}
                {s.progress && !s.done && <span className="ml-2 text-xs font-normal text-brand">{s.progress}</span>}
              </p>
              {!s.done && <p className="mt-0.5 text-xs text-ink-soft">{s.why}</p>}
            </div>
            {!s.done && (
              <LinkButton href={s.href} variant="secondary" size="sm">{s.cta}</LinkButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

