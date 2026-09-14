import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: {
            50: '#FFF0F3',
            100: '#FFB5C5',
            200: '#FF9FB3',
            300: '#FF89A1',
            400: '#FF738F',
          },
          green: {
            50: '#F0FFF4',
            100: '#B5E8C3',
            200: '#9FE0B1',
            300: '#89D89F',
            400: '#73D08D',
          },
          blue: {
            50: '#F0F7FF',
            100: '#B5D4E8',
            200: '#9FC8E0',
            300: '#89BCD8',
            400: '#73B0D0',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
