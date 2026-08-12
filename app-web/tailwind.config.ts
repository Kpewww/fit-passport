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
        // CMU / Fit Passport accent — used sparingly on an editorial paper canvas.
        brand: {
          DEFAULT: "#A6192E", // CMU cardinal red
          dark: "#7d1222",
          light: "#f6e7ea",
          tint: "#fbf3f4",
        },
        // Warm ivory "paper" canvas — the editorial magazine base.
        paper: {
          DEFAULT: "#F7F3EC",
          soft: "#FCFAF5",
          dim: "#ECE6D9",
        },
        // Warm near-black ink + warm grays (reads more premium than pure gray).
        ink: {
          DEFAULT: "#201c18",
          soft: "#57514a",
          faint: "#938b80",
        },
        line: "#E3DCCE", // hairline rules on paper
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
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "rise": "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
