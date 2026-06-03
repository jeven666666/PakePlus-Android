/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        agnes: {
          bg: "#0B0F1A",
          "bg-secondary": "#101523",
          card: "#121827",
          "card-hover": "#151B2D",
          "card-active": "#1A2238",
          border: "rgba(255,255,255,0.08)",
          "border-hover": "rgba(255,255,255,0.14)",
          purple: "#7C5CFF",
          "purple-dim": "#5A3FD6",
          blue: "#4DA3FF",
          cyan: "#00D4FF",
          "text-primary": "#F3F5FF",
          "text-secondary": "#A7B0C5",
          "text-muted": "#7C8498",
          success: "#3EE08F",
          warning: "#F5C451",
          error: "#FF6B6B",
          info: "#4DA3FF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "PingFang SC",
          "HarmonyOS Sans",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
        input: "12px",
        panel: "20px",
      },
      backdropBlur: {
        glass: "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-right": "slideRight 0.2s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        progress: "progress 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 8px rgba(124,92,255,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(0,212,255,0.4)" },
        },
        progress: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
