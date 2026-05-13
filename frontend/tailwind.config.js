/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* F1 Core Colors */
        'f1-red':     '#E10600',
        'f1-red-dark':'#B30500',
        'f1-black':   '#15151E',
        'f1-dark':    '#1F1F27',
        'f1-elevated':'#2D2D35',
        'f1-border':  '#38383F',
        'f1-muted':   '#67676D',
        'f1-white':   '#FFFFFF',
        /* Tyre Compounds */
        'soft':       '#E8002D',
        'medium':     '#FFC906',
        'hard':       '#FFFFFF',
        'inter':      '#39B54A',
        'wet':        '#0067FF',
        /* Team Colors */
        'red-bull':   '#3671C6',
        'ferrari':    '#E8002D',
        'mercedes':   '#27F4D2',
        'mclaren':    '#FF8000',
        'aston':      '#229971',
        'alpine':     '#FF87BC',
        'williams':   '#64C4FF',
        'haas':       '#B6BABD',
        'sauber':     '#52E252',
        'rb':         '#6692FF',
      },
      fontFamily: {
        sans: ["'Titillium Web'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        display: ["'Barlow Condensed'", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* F1-style typography scale */
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.6" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
      },
      fontWeight: {
        /* Emphasize bold weights for F1 style */
        hairline: 100,
        thin: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },
      backgroundImage: {
        carbon:
          "repeating-linear-gradient(-45deg, #141416 0px, #141416 2px, #101012 2px, #101012 4px)",
      },
      boxShadow: {
        /* F1-style shadows with red glow */
        glow: "0 0 0 1px rgba(239, 51, 64, 0.35)",
        "glow-lg": "0 0 20px rgba(239, 51, 64, 0.25)",
        "glow-xl": "0 0 40px rgba(239, 51, 64, 0.2)",
      },
      animation: {
        /* F1-style smooth animations */
        "pulse-red": "pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-down": "slide-in-down 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-up": "slide-in-up 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-in-down": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      transitionTimingFunction: {
        /* F1-style easing */
        "f1-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
