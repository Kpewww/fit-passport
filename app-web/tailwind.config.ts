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
          faint: "#8a8d97",
        },
        line: "#E2E3E7", // hairline rules
      },
      letterSpacing: {
        editorial: "0.24em",
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
        // A metal glint: crosses quickly, then waits — so it reads as a passing
        // reflection rather than a constant animation.
        glint: {
          "0%": { transform: "translateX(-120%)" },
          "14%": { transform: "translateX(120%)" },
          "100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "rise": "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.5s infinite",
        glint: "glint 11s cubic-bezier(0.4,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
