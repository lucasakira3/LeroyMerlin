/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lm-green': '#00843d',
        'lm-yellow': '#ffd100',
        'lm-dark': '#1a1a1a',
        'lm-light': '#f5f5f5',
        'lm-orange': '#e87722',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
