import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // Editorial pairing: a characterful serif for display, clean sans for UI.
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // The single "rare accent" — a confident cobalt (research: blue reinforces
        // sophistication + it reads bold/premium). Named `brand` so every existing
        // `text-brand`/`bg-brand` flips to cobalt in one place. Used sparingly.
        brand: {
          DEFAULT: "#2438d6", // cobalt
          dark: "#1a2aa8",
          light: "#e9ebfb",
          tint: "#f2f3fc",
        },
        // Cool "porcelain" off-white — the light working surface (pairs with black
        // + cobalt). Black is the statement color; porcelain is where you read/work.
        paper: {
          DEFAULT: "#F3F3F1",
          soft: "#FBFBFA",
          dim: "#E6E7E9",
        },
        // Cool near-black ink + cool grays — high-end, evidence-backed premium cue.
        ink: {
          DEFAULT: "#17181c",
          soft: "#4c4e57",
          // #8a8d97 until Session 76 R7: it measured 2.98:1 on porcelain, below WCAG AA
          // (4.5:1) for the small print it is used for. #6b6d77 is 4.63:1.
          faint: "#6b6d77",
        },
        line: "#E2E3E7", // hairline rules
        // Semantic states, desaturated to sit on porcelain beside ink and cobalt.
        // They replace stock green-100/amber-100/red-100 so a warning reads as part
        // of the palette rather than a sticker on it. Never used as an accent.
        ok: { DEFAULT: "#2f6b4f", tint: "#edf3ef" },
        warn: { DEFAULT: "#8a5a12", tint: "#f7f1e5" },
        bad: { DEFAULT: "#9b2c2c", tint: "#f7eded" },
      },
      // One type scale for the whole product (Session 76). The serif is for
      // `display` and `h1` only; `meta` is the small tracked label for sizes,
      // centimetres and sources.
      fontSize: {
        display: ["clamp(2.75rem, 6vw, 5.5rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        h1: ["clamp(2.125rem, 1.75rem + 1.2vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        h2: ["1.625rem", { lineHeight: "1.18", letterSpacing: "-0.01em" }],
        h3: ["1.0625rem", { lineHeight: "1.35" }],
        meta: ["0.6875rem", { lineHeight: "1.25", letterSpacing: "0.14em" }],
      },
      letterSpacing: {
        editorial: "0.24em",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(32,28,24,0.04), 0 4px 16px rgba(32,28,24,0.05)",
        lift: "0 10px 40px rgba(32,28,24,0.10)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // The undo toast (closet, Session 88e): in, out, and its countdown bar.
        "toast-in": {
          "0%": { opacity: "0", transform: "translate(-50%, 12px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0) scale(1)" },
        },
        "toast-out": {
          "0%": { opacity: "1", transform: "translate(-50%, 0) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, 10px) scale(0.97)" },
        },
        drain: {
          "0%": { transform: "scaleX(1)" },
          "100%": { transform: "scaleX(0)" },
        },
        // An in-place confirm opening where its button was.
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // A metal glint: crosses at a measured pace, then waits — so it reads as a
        // passing reflection rather than a constant animation. The crossing takes
        // 24% of the cycle (~3.1s of 13s); the rest is the pause.
        glint: {
          "0%": { transform: "translateX(-120%)" },
          "24%": { transform: "translateX(120%)" },
          "100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "rise": "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.5s infinite",
        "toast-in": "toast-in 0.28s cubic-bezier(0.16,1,0.3,1) both",
        "toast-out": "toast-out 0.22s ease-in both",
        "pop-in": "pop-in 0.16s ease-out both",
        // Its duration is set inline from the closet's UNDO_MS.
        drain: "drain 6s linear both",
        glint: "glint 13s cubic-bezier(0.45,0,0.3,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
