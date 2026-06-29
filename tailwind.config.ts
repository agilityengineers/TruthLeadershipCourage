import type { Config } from "tailwindcss";

/**
 * TLC design tokens — sourced verbatim from the design handoff README.
 * Pillar mapping: EQ #024794 · IQ #262161 · MQ™ #662d91.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand pillars
        eq: { DEFAULT: "#024794", hover: "#013a7c" },
        iq: { DEFAULT: "#262161" },
        mq: { DEFAULT: "#662d91" },
        sky: { DEFAULT: "#b8d8e6" },
        // Dark surfaces (sidebars)
        indigo: {
          DEFAULT: "#262161",
          950: "#1b1942",
          975: "#16142b",
          990: "#0f0e22",
        },
        // Ink / text
        ink: { DEFAULT: "#1c1a33", soft: "#22223a" },
        muted: {
          DEFAULT: "#5a5e72",
          2: "#7a7e92",
          3: "#9498ab",
        },
        // Surfaces
        page: "#eef1f7",
        soft: { 1: "#f6f8fc", 2: "#f8f9fc", 3: "#f4f6fb" },
        // Hairlines
        hair: { 1: "#e7eaf2", 2: "#eceef4", 3: "#eef0f5" },
        // Status
        success: "#1c7d4d",
        warning: "#b8860b",
        warn2: "#e0a32e",
        danger: "#b03a52",
        // shadcn semantic tokens (mapped to CSS vars in globals.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "14px",
        pill: "100px",
      },
      boxShadow: {
        card: "0 12px 34px rgba(26,24,48,.07)",
        hero: "0 24px 60px rgba(26,24,48,.18)",
        lift: "0 16px 38px rgba(26,24,48,.14)",
        float: "0 14px 34px rgba(26,24,48,.18)",
      },
      maxWidth: {
        shell: "1140px",
        prose: "660px",
      },
      letterSpacing: {
        eyebrow: ".16em",
        label: ".1em",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
