/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1116",
          900: "#07090C",
          800: "#0E1116",
          700: "#161A21",
          600: "#1E232C",
          500: "#2A303B",
        },
        gold: {
          DEFAULT: "#C9A961",
          light: "#D9BD7E",
          dark: "#A8884A",
          faint: "#E8D9B0",
        },
        sage: {
          DEFAULT: "#2D4A35",
          light: "#3F6147",
          dark: "#1E3424",
        },
        ivory: {
          DEFAULT: "#F5F0E6",
          50: "#FBF8F1",
          100: "#F5F0E6",
          200: "#EBE3D2",
          300: "#DCD0B6",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.25em",
        ultra: "0.4em",
      },
      animation: {
        "ticker-scroll": "ticker-scroll 40s linear infinite",
        "fade-up": "fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 1.2s ease both",
        "shimmer": "shimmer 3s linear infinite",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
