/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    // Full list (not `extend`) so `xs` sorts before `sm` — an extended screen is
    // appended last and would then win over `sm:` at large widths.
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // TSNS brand tokens (from the original index.css)
        primary: {
          DEFAULT: "#16466A", // TSNS navy
          50: "#eef4f9",
          100: "#d6e4ef",
          200: "#adc9df",
          300: "#7fa6c8",
          400: "#4f7fa6",
          500: "#2a5d82",
          600: "#1b587f",
          700: "#16466A",
          800: "#103754",
          900: "#0b253a",
        },
        // Turkish red, split into two working tones:
        //   DEFAULT/500 -> fills (buttons, bands, badges). White on it = 5.0:1.
        //   600         -> small red text on cream/white.  5.7:1 on cream.
        //   300         -> small red text on the dark theme. 7.1:1 on primary-900.
        accent: {
          DEFAULT: "#D81E34",
          50: "#FEF2F3",
          100: "#FDE0E3",
          200: "#FAC0C7",
          300: "#F2949F",
          400: "#E75A6C",
          500: "#D81E34",
          600: "#B8172A",
          700: "#96101F",
          800: "#7C0E1B",
          900: "#690F1A",
        },
        gold: {
          DEFAULT: "#FFD200", // Nova Scotia yellow
          dark: "#e6bd00",
        },
        // Anthropic-style warm cream for the light theme background
        cream: {
          50: "#FAF8F2",
          DEFAULT: "#F0EEE6",
          100: "#F0EEE6",
          200: "#E7E1D2",
          300: "#D9D2BF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
        screens: { "2xl": "1200px" },
      },
      boxShadow: {
        card: "0 6px 24px -8px rgba(2,6,23,0.12)",
      },
    },
  },
  plugins: [],
};
