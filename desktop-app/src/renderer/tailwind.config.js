/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5F8D78',
        'primary-dark': '#4A6F5E',
        danger: '#ef4444',
        warning: '#fbbf24',
      },
    },
  },
  plugins: [],
}
