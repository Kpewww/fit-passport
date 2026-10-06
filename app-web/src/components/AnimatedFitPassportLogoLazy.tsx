"use client";

// The reveal, loaded after the page (Session 89). On pages that do not otherwise use
// Framer Motion (/extension/welcome, /onboarding), importing the reveal directly added
// ~33 kB to their first load. Loaded on demand, the page paints first with the mark's
// space held, and the quick reveal plays a moment later.

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { AnimatedFitPassportLogo as Reveal } from "./AnimatedFitPassportLogo";

type Props = ComponentProps<typeof Reveal>;

const Lazy = dynamic(() => import("./AnimatedFitPassportLogo").then((m) => m.AnimatedFitPassportLogo), {
  ssr: false,
  loading: () => null,
});

export function AnimatedFitPassportLogoLazy(props: Props) {
  const size = props.size ?? 96;
  return (
    // The box is held at the mark's size whether or not the reveal has loaded yet.
    <span className={`relative inline-block align-middle ${props.className ?? ""}`} style={{ width: size, height: size }}>
      <Lazy {...props} className="absolute inset-0" />
    </span>
  );
}
