import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
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
        // Custom colors
        snapfai: {
          white: "#FFFFFF",
          gray: "#808080",
          silver: "#C0C0C0",
          lightyellow: "#FFF8D6", // Softened yellow
          black: "#000000", // Replaced brown with black
          sand: "#F2E8DC", // Complementary color
          amber: "#FFBF69", // Accent color
          navy: "#1A3A5A", // Dark accent
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'inherit',
            a: {
              color: 'var(--amber)',
              '&:hover': {
                color: 'var(--amber-dark)',
              },
            },
            h1: {
              color: 'inherit',
              marginTop: '0.75em',
              marginBottom: '0.5em',
            },
            h2: {
              color: 'inherit',
              marginTop: '0.75em',
              marginBottom: '0.5em',
            },
            h3: {
              color: 'inherit',
              marginTop: '0.75em',
              marginBottom: '0.5em',
            },
            p: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            strong: {
              color: 'inherit',
            },
            blockquote: {
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config

export default config
