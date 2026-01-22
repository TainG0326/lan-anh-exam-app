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
        primary: "#D4E95D", // Premium Lime Green
        "primary-foreground": "#000000",
        "primary-hover": "#C4D94D",
        background: "#F8FAFC", // Primary app background
        "background-light": "#FFFFFF", // Card background
        border: "#E2E8F0", // Subtle borders
        "text-primary": "#0F172A", // Navy for headings
        "text-secondary": "#64748B", // Body text
        "text-muted": "#94A3B8",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '1.5rem', // 24px
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.05em',
      },
    }
  },
  plugins: [],
}


