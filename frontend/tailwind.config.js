/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: '#101827',
        lamp: '#D4A24C',
        paper: '#F7F1E7',
        'bengali-red': '#8B1E2D',
        smoke: 'rgba(255, 255, 255, 0.05)',
        ink: '#2A2A2A',
      },
      fontFamily: {
        serif: ['"Tiro Bangla"', '"Noto Serif Bengali"', 'serif'],
        sans: ['"Anek Bangla"', '"Hind Siliguri"', 'sans-serif'],
      },
      animation: {
        'fade-in-slow': 'fadeInSlow 3s ease-in-out forwards',
        'fade-in-fast': 'fadeInFast 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInSlow: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInFast: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '55%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
