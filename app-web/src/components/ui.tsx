// Shared UI primitives for Fit Passport.
// Small, dependency-free, Tailwind-based. Keep these consistent so every screen
// reads as one product.

import Link from "next/link";
import type { ReactNode } from "react";

// ---------- Button ----------

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const btnVariants: Record<string, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark active:scale-[0.98] shadow-card",
  secondary:
    "border border-neutral-300 bg-white text-ink hover:border-neutral-400 hover:bg-neutral-50",
  ghost: "text-ink-soft hover:bg-neutral-100",
};
const btnSizes: Record<string, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  onClick,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

// ---------- Card ----------

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-200/70 ${className}`}
    >
      {children}
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
  "w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

// ---------- Empty state ----------

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
        <span className="h-4 w-4 rounded-sm bg-brand" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
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
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const color = pct >= 75 ? "#16a34a" : pct >= 50 ? "#A6192E" : "#c2803a";
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eee"
          strokeWidth={stroke}
        />
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
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">
        {pct}%
      </span>
    </div>
  );
}

// ---------- Accuracy badge ----------

export function AccuracyBadge({ tier }: { tier: "low" | "medium" | "high" }) {
  const map = {
    low: { label: "Basic accuracy", cls: "bg-amber-100 text-amber-800" },
    medium: { label: "Good accuracy", cls: "bg-blue-100 text-blue-800" },
    high: { label: "High accuracy", cls: "bg-green-100 text-green-800" },
  } as const;
  const m = map[tier];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ---------- Skeleton line ----------

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-neutral-200/70 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}
