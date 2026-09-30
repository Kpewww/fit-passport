"use client";

// CategoryPicker — a sectioned garment-type selector (Tops / Bottoms / Footwear
// / Accessories). Replaces the flat <select> so the growing list of garment
// types stays browsable. Uses a native <select> with <optgroup> for zero-JS
// accessibility + mobile friendliness; the visible label comes from garments.ts.

import { inputClass } from "@/components/ui";
import { garmentSections } from "@/lib/garments";
import { useGarmentText } from "@/i18n/garment";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const g = useGarmentText();
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {garmentSections().map(({ section, items }) => (
        <optgroup key={section} label={g.section(section)}>
          {items.map((item) => (
            <option key={item.category} value={item.category}>
              {g.label(item.category)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
