import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--surface-muted) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        court: "rgb(var(--court) / <alpha-value>)",
        "court-dark": "rgb(var(--court-dark) / <alpha-value>)",
        "court-line": "rgb(var(--court-line) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-contrast": "rgb(var(--primary-contrast) / <alpha-value>)",
        ball: "rgb(var(--ball) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 18px 60px rgb(24 32 30 / 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
