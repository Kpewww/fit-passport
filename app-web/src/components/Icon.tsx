// The one icon set: Phosphor (MIT), Light weight — every icon in the app comes
// through this file.
//
// Why one file: one weight and one default size across the whole product is most
// of what makes icons read as a system rather than a collection, and it makes
// changing either a single edit — the same reasoning as `colors.ts` (invariant ㉛).
// Emoji are not icons and are not used anywhere (`noEmoji.test.ts`).
//
// The path data is generated (`npm run icons`, scripts/gen-icons.mjs) with only
// the weights we draw. Phosphor's React package ships all six weights inside
// every icon; measured in Session 76 that cost 13.6 kB gzipped for 17 UI icons
// on every page. Each icon is a plain function declaration, never a factory call
// like `make(D.Star)`: a top-level call kept every icon alive on every page (all
// 59 paths, +10 kB, even marked PURE), while an unused function is dropped.
// Plain SVG, no context or hooks — works in server and client components alike.
//
// Sizes: 16 inline with small text, 20 default, 24 for standalone controls.

import type { SVGProps } from "react";
import * as D from "@/components/icons.generated";
import type { IconData } from "@/components/icons.generated";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  /** `fill` exists only for toggles (rating, like, pin); elsewhere it draws Light. */
  weight?: "light" | "fill";
  /** A label makes the icon meaningful to screen readers; without one it is decorative. */
  label?: string;
};

/**
 * Draws generated 256-grid path data — shared by Icon and GarmentIcon. `weight`
 * is taken out here because the caller has already chosen the data by it; it is
 * not an SVG attribute.
 */
export function Svg({ data, size = 20, label, weight, ...rest }: IconProps & { data: IconData }) {
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

export function ArrowDown(p: IconProps) { return <Svg data={D.ArrowDownLight} {...p} />; }
export function ArrowLeft(p: IconProps) { return <Svg data={D.ArrowLeftLight} {...p} />; }
export function ArrowRight(p: IconProps) { return <Svg data={D.ArrowRightLight} {...p} />; }
export function ArrowUpRight(p: IconProps) { return <Svg data={D.ArrowUpRightLight} {...p} />; }
export function Refresh(p: IconProps) { return <Svg data={D.ArrowsClockwiseLight} {...p} />; }
export function Reorder(p: IconProps) { return <Svg data={D.ArrowsDownUpLight} {...p} />; }
export function BrowserIcon(p: IconProps) { return <Svg data={D.BrowserLight} {...p} />; }
export function Camera(p: IconProps) { return <Svg data={D.CameraLight} {...p} />; }
export function CaretDown(p: IconProps) { return <Svg data={D.CaretDownLight} {...p} />; }
export function CaretRight(p: IconProps) { return <Svg data={D.CaretRightLight} {...p} />; }
export function Check(p: IconProps) { return <Svg data={D.CheckLight} {...p} />; }
export function CheckCircle(p: IconProps) { return <Svg data={D.CheckCircleLight} {...p} />; }
export function Download(p: IconProps) { return <Svg data={D.DownloadSimpleLight} {...p} />; }
export function Mail(p: IconProps) { return <Svg data={D.EnvelopeSimpleLight} {...p} />; }
export function Eye(p: IconProps) { return <Svg data={D.EyeLight} {...p} />; }
export function Globe(p: IconProps) { return <Svg data={D.GlobeLight} {...p} />; }
export function Heart({ weight, ...p }: IconProps) { return <Svg data={weight === "fill" ? D.HeartFill : D.HeartLight} {...p} />; }
export function Photo(p: IconProps) { return <Svg data={D.ImageSquareLight} {...p} />; }
export function Info(p: IconProps) { return <Svg data={D.InfoLight} {...p} />; }
export function Bolt(p: IconProps) { return <Svg data={D.LightningLight} {...p} />; }
export function LinkIcon(p: IconProps) { return <Svg data={D.LinkSimpleLight} {...p} />; }
export function Menu(p: IconProps) { return <Svg data={D.ListLight} {...p} />; }
export function Lock(p: IconProps) { return <Svg data={D.LockSimpleLight} {...p} />; }
export function Search(p: IconProps) { return <Svg data={D.MagnifyingGlassLight} {...p} />; }
export function Basket(p: IconProps) { return <Svg data={D.BasketLight} {...p} />; }
export function Note(p: IconProps) { return <Svg data={D.NoteLight} {...p} />; }
export function PaletteIcon(p: IconProps) { return <Svg data={D.PaletteLight} {...p} />; }
export function Pencil(p: IconProps) { return <Svg data={D.PencilSimpleLight} {...p} />; }
export function Plus(p: IconProps) { return <Svg data={D.PlusLight} {...p} />; }
export function Pin({ weight, ...p }: IconProps) { return <Svg data={weight === "fill" ? D.PushPinFill : D.PushPinLight} {...p} />; }
export function Robot(p: IconProps) { return <Svg data={D.RobotLight} {...p} />; }
export function Ruler(p: IconProps) { return <Svg data={D.RulerLight} {...p} />; }
export function Scales(p: IconProps) { return <Svg data={D.ScalesLight} {...p} />; }
export function Seal(p: IconProps) { return <Svg data={D.SealCheckLight} {...p} />; }
export function Shield(p: IconProps) { return <Svg data={D.ShieldCheckLight} {...p} />; }
export function Sparkle(p: IconProps) { return <Svg data={D.SparkleLight} {...p} />; }
export function Star({ weight, ...p }: IconProps) { return <Svg data={weight === "fill" ? D.StarFill : D.StarLight} {...p} />; }
export function Store(p: IconProps) { return <Svg data={D.StorefrontLight} {...p} />; }
export function Trash(p: IconProps) { return <Svg data={D.TrashLight} {...p} />; }
export function Upload(p: IconProps) { return <Svg data={D.UploadSimpleLight} {...p} />; }
export function UserIcon(p: IconProps) { return <Svg data={D.UserLight} {...p} />; }
export function Account(p: IconProps) { return <Svg data={D.UserCircleLight} {...p} />; }
export function Warning(p: IconProps) { return <Svg data={D.WarningLight} {...p} />; }
export function Alert(p: IconProps) { return <Svg data={D.WarningCircleLight} {...p} />; }
export function Close(p: IconProps) { return <Svg data={D.XLight} {...p} />; }
