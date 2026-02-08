/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // IMPORTANT
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
