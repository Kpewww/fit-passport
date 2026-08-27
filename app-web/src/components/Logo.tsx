// The Fit Passport mark — "Fit Thread".
//
// One continuous thread draws an F and a P: the thread is the measurement line,
// the loop is the garment it comes back around to. Geometry is the cleaned master
// in docs/design/assets/logo/fit-passport-mark-master.svg; this file is generated
// from it, so edit the SVG and re-derive rather than hand-tweaking the path here.
//
// WHY THERE ARE TWO WEIGHTS. The master's stroke is 24 units on a 536-wide
// artwork — 4.5% of its width — which lands under one device pixel below ~32px.
// `micro` re-uses the same path but strokes its own outline, taking the stroke to
// ~7.7% without redrawing. 16 is the ceiling the geometry allows: the tightest
// interior gaps measure 20 units, so anything more merges them.
//
// Measured on a real render at true device pixels:
//   ≥32 device px  — micro reads well; the master needs ~40 before it stops
//                    looking like a hairline
//   24 device px   — micro is visible but the P bowl's counter fills in
//   ≤20 device px  — NEITHER weight survives. A 16px favicon needs a simplified
//                    glyph, not a thinner or fatter version of this one.
// Hence the switch below is at 40 CSS px: under a 1x display the master would be
// too light, and micro at 2x is merely a touch heavy — the safer error.

const MARK_PATH = "M416.99 0.01 C418.83 0.01 420.66 0.01 422.49 0.01 C423.76 0.14 425.03 0.27 426.3 0.4 C456.04 3.41 479.05 9.96 501.77 30.39 C547.21 71.28 546.93 145.94 504 188.23 C466.35 225.33 420.13 219.57 371.59 219.6 C358.81 219.61 346.03 219.6 333.25 219.59 C326.52 219.58 319.23 220.33 312.68 219.03 C314.04 212.16 315.41 205.3 316.77 198.43 C326.64 196.38 341.48 197.94 351.95 197.94 C368.48 197.94 385 197.93 401.52 197.94 C411.44 197.94 421.55 198.48 431.44 197.71 C455.93 195.81 479.75 184.75 495.38 165.56 C500 159.89 503.8 153.69 506.76 147 C510.97 137.49 513.53 127.44 514.23 117.07 C515.17 103.13 512.97 89.02 507.46 76.13 C484.57 22.54 419.28 10.27 369.95 33.65 C339.92 47.88 317.23 74.83 303.56 104.7 C299.36 113.89 292.84 124.76 291.84 134.84 C304.27 135.68 317.03 134.98 329.51 135.03 C355.7 135.14 381.88 135.13 408.06 135.01 C422.31 134.95 441.3 137.23 448.55 121.55 C458.78 99.45 439.5 85.49 419.29 85.92 C403.34 86.25 388.24 93 377.22 104.46 C374.09 107.72 371.72 111.5 368.79 114.85 C364.89 114.92 360.99 115 357.1 115.07 C353.98 115.17 350.86 115.27 347.75 115.37 C346.57 115.32 345.4 115.26 344.22 115.2 C345.48 107.95 351.88 100.55 356.44 94.89 C374.55 72.4 404.56 60.04 433.26 65.29 C457.16 69.67 477.49 90.94 473.47 116.54 C470.35 136.4 455.58 151.58 435.86 155.51 C427.9 157.1 419.87 156.69 411.8 156.71 C383.44 156.78 355.07 156.82 326.71 156.84 C314.11 156.85 295.58 155.31 283.74 157.28 C278.89 170.73 276.37 185.31 273.61 199.28 C269.7 218.97 265.56 238.6 261.92 258.33 C260.37 266.78 258.93 275.25 257.3 283.69 C256.64 287.11 256.96 290.58 253.3 291.76 C251.77 291.89 250.25 292.02 248.73 292.15 C243.76 292.46 238.13 293.93 233.37 292.88 C238.3 261.67 244.49 230.47 250.88 199.56 C252.82 190.16 255.09 180.79 257.26 171.45 C258.32 166.86 260.32 161.83 260.31 157.14 C252.93 156.36 245.29 156.84 237.86 156.83 C215.92 156.8 193.44 158.1 171.62 155.5 C114.91 148.73 64.35 123.22 28.79 77.88 C21.39 68.45 14.78 58.77 8.6 48.49 C5.41 43.19 1.18 37.13 0 31.04 C6.34 27.85 12.69 24.67 19.04 21.48 C27.74 36.56 35.3 51.37 46.26 65.05 C74.99 100.94 112.38 122.31 157.17 131.05 C166.66 132.9 176.44 134.56 186.11 134.66 C189.51 134.67 192.91 134.67 196.31 134.67 C220.13 134.66 243.96 134.65 267.79 134.65 C271.43 129.25 272.71 121.55 275.04 115.4 C279.16 104.53 284.18 93.64 289.79 83.45 C306.22 53.57 330.95 27.09 362.46 13.03 C378.32 5.96 395.15 2.45 412.27 0.45 C413.85 0.3 415.42 0.15 416.99 0.01ZM284.16 332.04 C281.65 332.14 279.15 332.23 276.64 332.33 C267.15 332.82 257.65 333.32 248.15 333.81 C246.4 339.58 245.72 345.67 244.53 351.58 C242.69 360.72 240.61 369.85 238.51 378.92 C227.63 425.83 211.17 493.74 153.7 501.05 C145.75 502.06 138.15 501.78 130.32 499.99 C119.72 497.57 109.48 492.36 101.71 484.68 C77.67 460.92 80.95 424.33 94.69 396.12 C122.51 339.04 189.81 317.44 248.62 311.79 C249.83 311.65 251.05 311.51 252.26 311.37 C255.1 311.2 257.94 311.03 260.78 310.85 C262.69 310.73 264.61 310.61 266.52 310.49 C300.09 309.49 337.03 316.04 362.56 288.98 C368.17 283.04 372.43 276.37 376.27 269.19 C381 269.67 392.73 275.26 395.91 278.83 C384.6 305.72 356.9 325.95 328.54 330.62 C313.93 333.02 298.9 331.57 284.16 332.04ZM106.18 433.57 C106.18 436.73 106.18 439.89 106.18 443.05 C106.87 450.09 108.32 456.87 112.21 462.93 C126.23 484.77 157.01 483.49 175.47 468.5 C201.52 447.36 209.96 403.52 217.08 372.54 C218.82 365 220.59 357.46 222.21 349.88 C223.04 346.02 224.61 341.53 223.51 337.77 C213.94 337.87 201.17 342.61 191.99 345.64 C151.98 358.86 110.66 388.22 106.18 433.57Z";

// Grown stroke for small sizes. See the note above for why it is 16 and not more.
const MICRO_STROKE = 16;

export function Logo({
  size = 40,
  withWordmark = false,
  className = "",
  weight,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /** Override the automatic weight. Rarely needed. */
  weight?: "master" | "micro";
}) {
  const micro = (weight ?? (size < 40 ? "micro" : "master")) === "micro";
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 536.03 501.64"
      fill="none"
      role="img"
      aria-label="Fit Passport"
      className={className}
    >
      <path
        d={MARK_PATH}
        fill="currentColor"
        {...(micro
          ? {
              stroke: "currentColor",
              strokeWidth: MICRO_STROKE,
              strokeLinejoin: "round" as const,
              strokeLinecap: "round" as const,
            }
          : {})}
      />
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
