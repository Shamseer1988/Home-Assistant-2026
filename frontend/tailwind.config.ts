import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware tokens (driven by CSS variables in globals.css)
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        // SIDRA brand palette
        sidra: {
          bg: "#070b16",
          panel: "#0b1226",
          card: "#111a32",
          blue: "#4d79ff",
          sky: "#59a0ff",
          gold: "#e9c46a",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        glass: "0 18px 40px rgba(0,0,0,0.18)",
        glow: "0 0 30px rgba(77,121,255,0.25)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
