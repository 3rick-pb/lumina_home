import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#f4f5f0',
          100: '#e5e8da',
          200: '#cbd4b7',
          300: '#aab88c',
          400: '#899b66',
          500: '#6c804b',
          600: '#526437',
          700: '#42502e',
          800: '#364128',
          900: '#303825', // Sage green / Olive inspired by home decor
          DEFAULT: '#526437'
        },
        accent: {
          50: '#fdf6f5',
          100: '#fbf0ed',
          200: '#f6dbd5',
          300: '#f0beb2',
          400: '#e59785',
          500: '#d56b53',
          600: '#c24b33',
          700: '#a33b26', // Terracotta
          800: '#873322',
          900: '#712d1f',
          DEFAULT: '#c24b33'
        }
      },
    },
  },
  plugins: [],
};
export default config;
