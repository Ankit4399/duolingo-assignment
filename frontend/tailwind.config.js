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
        duoGreen: "#58cc02",
        duoBlue: "#1cb0f6",
        duoYellow: "#ffc800",
        duoOrange: "#ff9600",
        duoRed: "#ff4b4b",
        duoPurple: "#8b6bf2",
      },
    },
  },
  plugins: [],
};
