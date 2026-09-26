/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        text: 'hsl(0, 0%, 100%)',
        background: 'hsl(279, 100%, 3%)',
        primary: {
          DEFAULT: 'hsl(288, 100%, 70%)',
          50: '#fdf4ff',
          500: 'hsl(288, 100%, 70%)',
          600: 'hsl(288, 80%, 60%)',
          700: 'hsl(288, 70%, 50%)',
        },
        secondary: 'hsl(301, 100%, 20%)',
        accent: {
          DEFAULT: 'hsl(141, 100%, 50%)',
          blue: '#38bdf8',
          amber: '#fbbf24',
          emerald: 'hsl(141, 100%, 50%)',
          rose: '#f43f5e',
        },
        surface: '#120517',
        'surface-elevated': 'hsl(301, 100%, 12%)',
        border: 'hsl(301, 60%, 25%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

