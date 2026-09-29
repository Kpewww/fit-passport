// A garment's cover: the wearer's own photo, or — until there is one — the
// garment's colour with its line icon, the icon in white or ink by the colour's
// luminance. It fills its parent; the parent sets the shape (4:5 in the closet).
// Shared by the closet gallery and the homepage's "what you get" card, so the
// product and its advertisement cannot drift apart.

import { GarmentIcon } from "@/components/GarmentIcon";
import { colorHex, iconToneOn } from "@/lib/colors";

export function GarmentCover({
  category,
  color,
  photo,
  iconSize = 56,
  imgClassName = "",
}: {
  category: string;
  color: string | null;
  photo?: string | null;
  iconSize?: number;
  imgClassName?: string;
}) {
  const hex = colorHex(color);
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: photo ? "#E6E7E9" : hex ?? "#E6E7E9" }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className={`h-full w-full object-cover ${imgClassName}`} />
      ) : (
        <GarmentIcon category={category} size={iconSize} className={iconToneOn(hex) === "light" ? "text-white/80" : "text-ink/50"} />
      )}
    </div>
  );
}
