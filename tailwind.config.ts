import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F97316", // orange soft
        primaryHover: "#EA580C",
        background: "#FFF7ED",
        textPrimary: "#1F2937",
        textSecondary: "#6B7280",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
