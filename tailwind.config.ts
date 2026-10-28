import type { Config } from "tailwindcss";

const color = (variable: string) => `hsl(var(--${variable}) / <alpha-value>)`;

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: color("border"),
        input: color("input"),
        ring: color("ring"),
        background: color("background"),
        foreground: color("foreground"),
        primary: {
          DEFAULT: color("primary"),
          foreground: color("primary-foreground"),
        },
        secondary: {
          DEFAULT: color("secondary"),
          foreground: color("secondary-foreground"),
        },
        destructive: {
          DEFAULT: color("destructive"),
          foreground: color("destructive-foreground"),
        },
        muted: {
          DEFAULT: color("muted"),
          foreground: color("muted-foreground"),
        },
        accent: {
          DEFAULT: color("accent"),
          foreground: color("accent-foreground"),
        },
        popover: {
          DEFAULT: color("popover"),
          foreground: color("popover-foreground"),
        },
        card: {
          DEFAULT: color("card"),
          foreground: color("card-foreground"),
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
