import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // CMU / Fit Passport brand
        brand: {
          DEFAULT: "#A6192E", // CMU cardinal red
          dark: "#7d1222",
          light: "#f6e7ea",
          tint: "#fbf3f4",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#4b4b4b",
          faint: "#7a7a7a",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,16,16,0.04), 0 4px 16px rgba(16,16,16,0.06)",
        lift: "0 8px 30px rgba(16,16,16,0.10)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
