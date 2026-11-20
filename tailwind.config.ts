import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/context/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: "#FF6A1A",
          dark: "#E0530A",
          light: "#FF9248"
        },
        gold: {
          DEFAULT: "#FFC400",
          soft: "#FFE066"
        }
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "var(--font-hind)", "Inter", "Hind Siliguri", "system-ui", "sans-serif"],
        script: ["'Dancing Script'", "cursive"]
      },
      boxShadow: {
        premium: "0 10px 40px -12px rgba(255, 106, 26, 0.35)",
        card: "0 4px 20px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(22px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        heartPop: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.5) rotate(-8deg)" },
          "55%": { transform: "scale(0.88) rotate(4deg)" },
          "80%": { transform: "scale(1.08) rotate(0deg)" },
          "100%": { transform: "scale(1)" }
        },
        cartBounce: {
          "0%": { transform: "scale(1) translateY(0)" },
          "30%": { transform: "scale(1.12) translateY(-3px)" },
          "55%": { transform: "scale(0.96) translateY(1px)" },
          "100%": { transform: "scale(1) translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        fadeSlide: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,106,26,0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,106,26,0)" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
        heartPop: "heartPop 0.55s cubic-bezier(0.34,1.56,0.64,1)",
        cartBounce: "cartBounce 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        fadeSlide: "fadeSlide 0.5s cubic-bezier(0.16,1,0.3,1)",
        glowPulse: "glowPulse 2.2s cubic-bezier(0.4,0,0.6,1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
