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
        // Glassmorphism colors
        glass: {
          100: 'rgba(255, 255, 255, 0.1)',
          200: 'rgba(255, 255, 255, 0.2)',
          300: 'rgba(255, 255, 255, 0.3)',
          400: 'rgba(255, 255, 255, 0.4)',
          dark: 'rgba(15, 23, 42, 0.1)',
          darkHover: 'rgba(15, 23, 42, 0.15)',
        },
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
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 12px 48px 0 rgba(31, 38, 135, 0.2)',
        'glow-primary': '0 0 20px rgba(212, 233, 93, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.05em',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    }
  },
  plugins: [],
}
