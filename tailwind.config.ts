import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9ff",
          100: "#e8f1ff",
          200: "#c7ddff",
          300: "#99c0ff",
          400: "#6ba5ff",
          500: "#3a88ff",
          600: "#236af0",
          700: "#1a50c5",
          800: "#163f9b",
          900: "#122f73",
          950: "#0b1d49"
        }
      }
    }
  },
  plugins: []
};

export default config;
