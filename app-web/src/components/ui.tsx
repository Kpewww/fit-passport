// Shared UI primitives for Fit Passport.
// Small, dependency-free, Tailwind-based. Keep these consistent so every screen
// reads as one product.
//
// The visual rules these encode (Session 76, "Editorial Atelier"): one primary
// action per screen, in ink; cobalt only for the rare highlight; hairlines and
// whitespace instead of shadows and fills; one icon set at one weight
// (components/Icon.tsx); the serif only for display and page titles.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Plus, Star } from "@/components/Icon";

// ---------- Button ----------

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

type ButtonLookProps = {
  variant?: Variant;
  size?: Size;
  /** A leading icon, from components/Icon.tsx. */
  icon?: ReactNode;
  /** A trailing arrow — for actions that take you somewhere. */
  arrow?: boolean;
  className?: string;
};

type ButtonProps = ButtonLookProps & {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Shows a spinner, disables the button and marks it busy for screen readers. */
  loading?: boolean;
  onClick?: () => void;
};

const btnBase =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const btnVariants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-black active:scale-[0.98]",
  secondary: "border border-line bg-white text-ink hover:border-ink/40",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  // Cobalt: the one rare accent. Reserved for the single most important action on
  // a dark band (the homepage hero) — not a second "primary".
  accent: "bg-brand text-white hover:bg-brand-dark active:scale-[0.98]",
};
// Phones get a 44px touch box by height, not by bigger type (build-state ㉕ rules).
const btnSizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs sm:h-8",
  md: "h-11 px-5 text-sm sm:h-10",
  lg: "h-12 px-7 text-base",
};

function ButtonInner({ children, icon, arrow, loading }: { children: ReactNode; icon?: ReactNode; arrow?: boolean; loading?: boolean }) {
  return (
    <>
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" aria-hidden />
      ) : (
        icon
      )}
      {children}
      {arrow && <ArrowRight size={16} className="transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5" />}
    </>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  loading,
  onClick,
  icon,
  arrow,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      <ButtonInner icon={icon} arrow={arrow} loading={loading}>{children}</ButtonInner>
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  arrow,
  className = "",
}: ButtonLookProps & { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}>
      <ButtonInner icon={icon} arrow={arrow}>{children}</ButtonInner>
    </Link>
  );
}

// ---------- Card ----------

/**
 * A white surface with a hairline — no shadow. Every block on every page used to
 * be a shadowed, ringed card, so none of them read as more important than the
 * next; the hairline alone separates without competing.
 */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rounded-2xl bg-white p-6 ring-1 ring-line ${className}`}>{children}</div>;
}

// ---------- Page container ----------

/**
 * The two page widths. `app` (72rem) is for pages you operate — the closet
 * gallery, community, outfits; `read` (48rem) for pages you read or fill in —
 * help, account, a single form. Pages move onto this as they are rebuilt.
 */
export function Page({
  children,
  width = "app",
  className = "",
}: {
  children: ReactNode;
  width?: "app" | "read";
  className?: string;
}) {
  const w = width === "app" ? "max-w-6xl" : "max-w-3xl";
  return (
    <main className="flex-1">
      <div className={`mx-auto ${w} px-4 pb-16 pt-10 sm:px-6 sm:pt-14 ${className}`}>{children}</div>
    </main>
  );
}

// ---------- Page + section headers ----------

/**
 * The one header shape for every page: a small tracked label, the page title in
 * the serif, one line of explanation, and at most one action on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-ink-faint">{eyebrow}</p>}
        <h1 className={`font-serif text-h1 text-ink ${eyebrow ? "mt-3" : ""}`}>{title}</h1>
        {lede && <p className="mt-3 max-w-xl text-ink-soft">{lede}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}

/** A section title with a hairline underneath and an optional action at the end. */
export function SectionHeader({
  title,
  meta,
  action,
  className = "",
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b border-line pb-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-h3 font-semibold text-ink">{title}</h2>
        {meta && <p className="mt-0.5 text-xs text-ink-faint">{meta}</p>}
      </div>
      {action && <div className="flex-shrink-0 text-sm">{action}</div>}
    </div>
  );
}

// ---------- Chip + segmented control ----------

/** A small selectable pill — filters, tags. Selected = ink; idle = hairline. */
export function Chip({
  children,
  selected = false,
  onClick,
  icon,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  const look = selected
    ? "border-ink bg-ink text-paper"
    : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink";
  const cls = `inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors duration-200 sm:h-8 ${look} ${className}`;
  if (!onClick) return <span className={cls}>{icon}{children}</span>;
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cls}>
      {icon}
      {children}
    </button>
  );
}

/** Two to four mutually exclusive options, as one control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  /** Names the control for screen readers. */
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-white p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-full px-3.5 text-xs font-medium transition-colors duration-200 ${
              on ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Field ----------

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/10";

// ---------- Empty state ----------

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  /** An icon from components/Icon.tsx; defaults to a plus. */
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-line text-ink-soft">
        {icon ?? <Plus size={20} />}
      </div>
      <h3 className="text-h3 font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Confidence ring ----------

export function ConfidenceRing({
  value,
  size = 72,
}: {
  value: number; // 0..1
  size?: number;
}) {
  const pct = Math.round(value * 100);
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  // tailwind tokens ok / brand / warn
  const color = pct >= 75 ? "#2f6b4f" : pct >= 50 ? "#2438d6" : "#8a5a12";
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E3E7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-ink">
        {pct}%
      </span>
    </div>
  );
}

// ---------- Accuracy badge ----------

export function AccuracyBadge({ tier }: { tier: "low" | "medium" | "high" }) {
  const map = {
    low: { label: "Basic accuracy", cls: "bg-warn-tint text-warn" },
    medium: { label: "Good accuracy", cls: "bg-brand-tint text-brand-dark" },
    high: { label: "High accuracy", cls: "bg-ok-tint text-ok" },
  } as const;
  const m = map[tier];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

// ---------- Fit stars ----------

/**
 * A 1–5 fit rating as five line stars, filled up to the rating. Ink, not amber:
 * the rating is information, and the palette keeps colour for the one accent.
 * It replaced six hand-built "★".repeat(n) strings that rendered as emoji-ish
 * glyphs of different widths on every platform.
 */
export function FitStars({ rating, size = 12, className = "" }: { rating: number; size?: number; className?: string }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={`inline-flex items-center gap-px text-ink ${className}`} role="img" aria-label={`Fit ${n} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} weight={i < n ? "fill" : "light"} className={i < n ? "" : "text-ink-faint"} />
      ))}
    </span>
  );
}

// ---------- Skeleton line ----------

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-paper-dim ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}
