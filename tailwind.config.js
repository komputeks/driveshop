/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg))",
        fg: "rgb(var(--fg))",
        card: "rgb(var(--card))",
        border: "rgb(var(--border))",
        muted: "rgb(var(--muted))",
        primary: "rgb(var(--primary))",
        secondary: "rgb(var(--secondary))",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      backgroundImage: {
        "grad-primary": "var(--grad-primary)",
        "grad-soft": "var(--grad-soft)",
      },
    },
  },
  plugins: [],
};