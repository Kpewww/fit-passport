"use client";

import { useEffect, useRef, useState } from "react";
import { suggestBrands } from "@/lib/brands";
import { inputClass } from "@/components/ui";

// Free-text brand field with suggestion dropdown. Suggestions never lock the
// input — the user can type any brand and submit it as-is.
export function BrandInput({
  value,
  onChange,
  placeholder = "Brand (e.g. Uniqlo)",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(suggestBrands(value));
    setActive(-1);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(brand: string) {
    onChange(brand);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open &&
    suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0].toLowerCase() === value.toLowerCase());

  return (
    <div ref={boxRef} className="relative">
      <input
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lift">
          {suggestions.map((b, i) => (
            <li key={b}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(b);
                }}
                className={`block w-full px-3 py-1.5 text-left text-sm ${
                  i === active ? "bg-brand-tint text-brand" : "text-ink hover:bg-neutral-50"
                }`}
              >
                {b}
              </button>
            </li>
          ))}
          <li className="border-t border-neutral-100 px-3 py-1.5 text-xs text-ink-faint">
            Not listed? Just type it — any brand works.
          </li>
        </ul>
      )}
    </div>
  );
}
