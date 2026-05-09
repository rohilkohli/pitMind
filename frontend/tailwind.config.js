/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pit: {
          bg: "#0a0a0b",
          panel: "#121214",
          stroke: "#2a2a2f",
          muted: "#9ca3af",
          fg: "#f4f4f5",
          accent: "#e10600",
          white: "#fafafa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        carbon:
          "repeating-linear-gradient(-45deg, #141416 0px, #141416 2px, #101012 2px, #101012 4px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(225, 6, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
