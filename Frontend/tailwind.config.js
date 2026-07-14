/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A4B8C",
          dark: "#0F2F5C",
          light: "#2C6BC4",
        },
        gold: {
          DEFAULT: "#C8941F",
          light: "#E5B94F",
          dark: "#8F6512",
        },
        maroon: {
          DEFAULT: "#6B1E3C",
          dark: "#4A1429",
        },
        canvas: "#F1F3F6",
        cta: {
          cart: "#FFE11B",
          buy: "#FB641B",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        constellation:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 60% 50%, rgba(255,255,255,0.12) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
