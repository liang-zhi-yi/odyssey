import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        primary: {
          DEFAULT: "oklch(0.55 0.2 260)",   // Indigo
          foreground: "oklch(0.985 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.97 0.005 260)",
          foreground: "oklch(0.205 0 0)",
        },
        muted: {
          DEFAULT: "oklch(0.97 0 0)",
          foreground: "oklch(0.556 0 0)",
        },
        accent: {
          DEFAULT: "oklch(0.65 0.2 180)",   // Teal accent
          foreground: "oklch(0.985 0 0)",
        },
        success: {
          DEFAULT: "oklch(0.6 0.18 145)",   // Green
          foreground: "oklch(0.985 0 0)",
        },
        warning: {
          DEFAULT: "oklch(0.7 0.15 85)",    // Amber
          foreground: "oklch(0.985 0 0)",
        },
        destructive: {
          DEFAULT: "oklch(0.55 0.2 20)",    // Red
          foreground: "oklch(0.985 0 0)",
        },
        border: "oklch(0.922 0 0)",
        card: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.145 0 0)",
        },
      },
      borderRadius: {
        DEFAULT: "0.625rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
