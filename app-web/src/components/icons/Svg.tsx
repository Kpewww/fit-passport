// The one drawing function behind every icon (components/Icon.tsx) and garment
// icon (components/GarmentIcon.tsx): Phosphor's 256-unit grid, filled outlines
// in currentColor. Plain SVG, no context or hooks, so it works in server and
// client components alike.

import type { SVGProps } from "react";

/** The `d` of each path in a 256×256 icon. */
export type IconData = readonly string[];

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  /** 16 inline with small text, 20 default, 24 for standalone controls. */
  size?: number | string;
  /** `fill` exists only for toggles (rating, like, pin); elsewhere it draws Light. */
  weight?: "light" | "fill";
  /** A label makes the icon meaningful to screen readers; without one it is decorative. */
  label?: string;
};

/**
 * Draws path data. `weight` is taken out here because the icon has already
 * chosen its data by it; it is not an SVG attribute.
 */
export function Svg({ data, size = 20, label, weight, ...rest }: IconProps & { data: IconData }) {
  void weight;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {data.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
