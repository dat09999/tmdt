/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'domix-dark': '#0f172a',
        'domix-gold': '#facc15',
        'domix-red': '#e11d48',
      }
    },
  },
  plugins: [],
}
