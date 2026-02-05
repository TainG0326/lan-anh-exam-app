/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5F8D78", // Muted sage/teal
        secondary: "#DCE6E1", // Light sage/cream mix
        "background-light": "#F9FBF9", // Very light cream/sage
        "background-dark": "#1A2321", // Deep dark green/charcoal
        "sage-light": "#E8F0EB",
        "cream": "#FCFCF9",
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    }
  },
  plugins: [],
}
