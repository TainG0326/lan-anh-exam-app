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
        primary: {
          DEFAULT: "#5F8D78",
          hover: "#4A6F5E",
          light: "#E8F0EB",
          dark: "#3D5F50",
        },
        secondary: "#DCE6E1",
        background: {
          DEFAULT: "#F7FAF9",
          light: "#F9FBF9",
          dark: "#1A2321",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          hover: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        success: {
          DEFAULT: "#3D7A4F",
          light: "#D4E8D7",
        },
        warning: {
          DEFAULT: "#B86E00",
          light: "#FFE8D6",
        },
        error: {
          DEFAULT: "#C53030",
          light: "#FDE8E8",
        },
        info: {
          DEFAULT: "#4A6FA5",
          light: "#DCE4F2",
        },
        sage: {
          light: "#E8F0EB",
        },
        cream: "#FCFCF9",
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "4px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 4px 16px -6px rgba(0,0,0,0.08)",
        card: "0 4px 16px -6px rgba(0,0,0,0.08)",
        button: "0 2px 8px rgba(46,125,107,0.25)",
        "soft-lg": "0 8px 24px -6px rgba(0,0,0,0.1)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      transitionTimingFunction: {
        elegant: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}
