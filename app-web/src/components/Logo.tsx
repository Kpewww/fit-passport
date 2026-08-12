// The Fit Passport mark.
//
// Concept: a passport-page arch (the rounded "gate" of a stamped travel document)
// wrapping a monogram F/P built from one continuous stroke, with a hairline
// baseline standing for the "one body, one line" measurement idea. Drawn as SVG
// so it stays crisp at any size and inherits `currentColor` — it works in ink on
// porcelain, white on a metal card, or any badge metal.

export function Logo({
  size = 40,
  withWordmark = false,
  className = "",
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Fit Passport"
      className={className}
    >
      {/* passport arch */}
      <path
        d="M10 20a14 14 0 0 1 28 0v14a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* monogram: F stem + arms, whose lower arm turns into the P bowl */}
      <path d="M19 15v18" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M19 15h9" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      <path
        d="M19 23h7a4.5 4.5 0 0 1 0 9h-7"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* measurement baseline */}
      <path d="M14 36.5h20" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
    </svg>
  );

  if (!withWordmark) return mark;
  return (
    <span className="inline-flex items-center gap-2">
      {mark}
      <span className="font-serif text-xl italic">Fit Passport</span>
    </span>
  );
}
