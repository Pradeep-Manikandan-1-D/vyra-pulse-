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
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        pulse: {
          lime: "#00FF66",
          neon: "#39FF14",
          emerald: "#10B981",
          dark: "#0A0A0A",
          charcoal: "#121212",
          card: "#161616",
          cardBorder: "rgba(255, 255, 255, 0.08)",
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
        "neon-glow": "0 0 25px -5px rgba(0, 255, 102, 0.4)",
        "neon-glow-sm": "0 0 15px -3px rgba(0, 255, 102, 0.3)",
        "flavor-citrus": "0 0 20px -3px rgba(204, 255, 0, 0.4)",
        "flavor-blueberry": "0 0 20px -3px rgba(56, 189, 248, 0.4)",
        "flavor-mango": "0 0 20px -3px rgba(245, 158, 11, 0.4)",
        "flavor-watermelon": "0 0 20px -3px rgba(244, 63, 94, 0.4)",
        "flavor-grape": "0 0 20px -3px rgba(168, 85, 247, 0.4)",
        "flavor-guava": "0 0 20px -3px rgba(236, 72, 153, 0.4)",
        "flavor-mint": "0 0 20px -3px rgba(20, 184, 166, 0.4)",
        "flavor-peach": "0 0 20px -3px rgba(251, 146, 60, 0.4)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
