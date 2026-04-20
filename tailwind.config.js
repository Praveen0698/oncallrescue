/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FEF2F2",
          100: "#FDE3E3",
          200: "#FCCDCC",
          300: "#F9A8A6",
          400: "#F37572",
          500: "#E84B45",
          600: "#C8372D",
          700: "#A92E25",
          800: "#8C2A23",
          900: "#742923",
          950: "#3F110E",
        },
        surface: {
          50: "#FAFAF7",
          100: "#F6F5F0",
          200: "#EFEDE6",
          300: "#E2E0D8",
          400: "#D1CFC5",
          500: "#B5B5AA",
        },
        ink: {
          900: "#1A1A18",
          800: "#2D2D2A",
          700: "#3D3D38",
          600: "#5A5A52",
          500: "#6B6B62",
          400: "#8A8A7F",
          300: "#B5B5AA",
          200: "#D1CFC5",
        },
        success: {
          50: "#E8F5EC",
          100: "#D1EBD9",
          500: "#2D8A56",
          600: "#26774A",
          700: "#1F6340",
        },
        warning: {
          50: "#FFF8E8",
          100: "#FFEFC5",
          500: "#C68B19",
          600: "#A87514",
        },
      },
      fontFamily: {
        display: ["'Outfit'", "sans-serif"],
        body: ["'Outfit'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        medium: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        heavy: "0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        pulse: "pulse 3s ease infinite",
        ripple: "ripple 1.5s ease infinite",
        countdown: "countdown 5s linear forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        ripple: {
          "0%": { boxShadow: "0 0 0 0 rgba(200,55,45,0.3)" },
          "100%": { boxShadow: "0 0 0 20px rgba(200,55,45,0)" },
        },
        countdown: {
          from: { width: "100%" },
          to: { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};
