/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
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
        accent: {
          DEFAULT: "#E30A17", // Turkish red
          50: "#fef2f3",
          100: "#fde0e2",
          200: "#fac5c9",
          300: "#f59da4",
          400: "#ed6671",
          500: "#E30A17",
          600: "#c80814",
          700: "#a60710",
          800: "#840a12",
          900: "#6d0d13",
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
