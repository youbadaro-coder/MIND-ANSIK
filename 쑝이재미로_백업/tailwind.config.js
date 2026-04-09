/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        premium: {
          gold: '#D4AF37',
          dark: '#0A0A0A',
          gray: '#1A1A1A',
        }
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
      }
    },
  },
  plugins: [],
}
