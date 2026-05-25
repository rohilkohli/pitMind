/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Legacy F1 tokens (keep for backward compat) ── */
        'f1-red':        '#E8002D',
        'f1-red-dark':   '#B30500',
        'f1-black':      '#15151E',
        'f1-dark':       '#1F1F27',
        'f1-elevated':   '#2D2D35',
        'f1-border':     '#38383F',
        'f1-muted':      '#67676D',
        'f1-white':      '#FFFFFF',
        'f1-secondary':  '#C4C4C4',

        /* ── PitMind Design System (reference) ── */
        'pm-red':        '#E8002D',
        'pm-carbon':     '#0a0a0a',
        'pm-carbon-mid': '#111114',
        'pm-carbon-light':'#1a1a1e',
        'pm-steel':      '#2a2a2f',
        'pm-chrome':     '#c8c8d0',
        'pm-neon':       '#39FF14',
        'pm-amber':      '#FF8C00',
        'pm-text':       '#f0f0f5',
        'pm-muted':      '#888890',

        /* Tyre Compounds */
        'soft':          '#E8002D',
        'medium':        '#FFC906',
        'hard':          '#FFFFFF',
        'inter':         '#39B54A',
        'wet':           '#0067FF',

        /* Team Colors */
        'red-bull':      '#3671C6',
        'ferrari':       '#E8002D',
        'mercedes':      '#27F4D2',
        'mclaren':       '#FF8000',
        'aston':         '#229971',
        'alpine':        '#FF87BC',
        'williams':      '#64C4FF',
        'haas':          '#B6BABD',
        'sauber':        '#52E252',
        'rb':            '#6692FF',
      },
      fontFamily: {
        /* Legacy */
        sans:    ["'Barlow Condensed'", "system-ui", "sans-serif"],
        mono:    ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        display: ["'Barlow Condensed'", "system-ui", "sans-serif"],
        /* New PitMind design system */
        race:    ["'Orbitron'", "system-ui", "sans-serif"],
        label:   ["'Barlow Condensed'", "system-ui", "sans-serif"],
        tele:    ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs:   ["0.75rem",   { lineHeight: "1.5" }],
        sm:   ["0.875rem",  { lineHeight: "1.5" }],
        base: ["1rem",      { lineHeight: "1.6" }],
        lg:   ["1.125rem",  { lineHeight: "1.6" }],
        xl:   ["1.25rem",   { lineHeight: "1.6" }],
        "2xl":["1.5rem",    { lineHeight: "1.4" }],
        "3xl":["1.875rem",  { lineHeight: "1.3" }],
        "4xl":["2.25rem",   { lineHeight: "1.2" }],
        "5xl":["3rem",      { lineHeight: "1.1" }],
      },
      fontWeight: {
        hairline: 100,
        thin:     200,
        light:    300,
        normal:   400,
        medium:   500,
        semibold: 600,
        bold:     700,
        extrabold:800,
        black:    900,
      },
      boxShadow: {
        glow:       "0 0 0 1px rgba(232, 0, 45, 0.35)",
        "glow-lg":  "0 0 20px rgba(232, 0, 45, 0.25)",
        "glow-xl":  "0 0 40px rgba(232, 0, 45, 0.2)",
        "neon-glow":"0 0 8px rgba(57, 255, 20, 0.6)",
        "red-glow": "0 0 12px rgba(232, 0, 45, 0.4)",
      },
      animation: {
        "pulse-red":    "pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-green":  "pulse-green 1.2s ease-in-out infinite",
        "slide-in-down":"slide-in-down 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-up":  "slide-in-up 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in":      "fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "feed-in":      "feed-in 0.3s ease",
        "glitch":       "glitch 8s infinite",
        "flicker":      "flicker 6s infinite",
        "throttle":     "throttle 3s ease-in-out infinite",
        "typing-bounce":"typing-bounce 1.2s ease infinite",
        "fade-up":      "fade-up 0.3s ease",
        "subtle-glow":  "subtle-glow 3s infinite ease-in-out",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "pulse-green": {
          "0%,100%": { opacity: "1", boxShadow: "0 0 4px #39FF14" },
          "50%": { opacity: "0.4", boxShadow: "none" },
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
        "feed-in": {
          "from": { opacity: "0", transform: "translateX(-8px)" },
          "to": { opacity: "1", transform: "translateX(0)" },
        },
        "glitch": {
          "0%,94%,100%": { clipPath: "none", transform: "none" },
          "95%": { clipPath: "inset(20% 0 50% 0)", transform: "translateX(-4px)" },
          "96%": { clipPath: "inset(60% 0 10% 0)", transform: "translateX(4px)" },
          "97%": { clipPath: "none", transform: "none" },
        },
        "flicker": {
          "0%,98%,100%": { opacity: "1" },
          "99%": { opacity: "0.6" },
        },
        "throttle": {
          "0%": { width: "0%" },
          "30%": { width: "100%" },
          "60%": { width: "75%" },
          "80%": { width: "95%" },
          "100%": { width: "0%" },
        },
        "typing-bounce": {
          "0%,80%,100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-5px)", opacity: "1" },
        },
        "fade-up": {
          "from": { opacity: "0", transform: "translateY(6px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "subtle-glow": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        "f1-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
