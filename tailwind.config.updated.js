/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{css,scss}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeOut': 'fadeOut 3s ease-in-out forwards',
      },
      keyframes: {
        fadeOut: {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      colors: {
        'litterpic-green': '#015E41',
      },
    },
  },
  plugins: [],
}
