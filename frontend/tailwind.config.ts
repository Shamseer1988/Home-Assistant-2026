import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // SIDRA brand palette (ported from the existing card_mod styling)
        sidra: {
          bg: "#070b16",
          panel: "#0b1226",
          card: "#111a32",
          blue: "#4d79ff",
          sky: "#59a0ff",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        glass: "0 18px 40px rgba(0,0,0,0.35)",
        glow: "0 0 30px rgba(77,121,255,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
