/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lm-green': '#00843d',
        // Verde da marca mais escuro, só pra TEXTO que fica direto sobre o fundo cinza da
        // página (lm-light): o lm-green ali dá 3.3:1 de contraste, abaixo do mínimo de 4.5:1.
        // Dentro de cartão branco o lm-green normal continua valendo.
        'lm-green-dark': '#046432',
        'lm-yellow': '#ffd100',
        'lm-dark': '#1a1a1a',
        'lm-light': '#d1d5db',
        'lm-orange': '#e87722',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
}
