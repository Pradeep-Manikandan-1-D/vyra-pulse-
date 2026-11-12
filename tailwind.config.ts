import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-inset": "var(--surface-inset)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        success: "var(--success)",
        error: "var(--error)",
        pulse: {
          lime: "#C8F169",
          forest: "#397B58",
          dark: "#101211",
          charcoal: "#171A18",
          card: "#1C211E",
          cardBorder: "#303832",
        },
        flavor: {
          citrus: "#CCFF00",
          blueberry: "#38BDF8",
          mango: "#F59E0B",
          watermelon: "#F43F5E",
          grape: "#A855F7",
          guava: "#EC4899",
          mint: "#14B8A6",
          peach: "#FB923C",
        },
      },
      boxShadow: {
        "soft-card": "0 4px 16px -2px rgba(32, 57, 43, 0.06), 0 1px 3px 0 rgba(32, 57, 43, 0.04)",
        "soft-card-dark": "0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 2px 6px -1px rgba(0, 0, 0, 0.25)",
        "primary-glow": "0 0 20px -3px var(--primary)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
