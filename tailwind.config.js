/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scendPink: '#ec4899',      // Scend primary pink
        buttonGrey: '#6b7280',     // Button gray (Tailwind gray-500)
        buttonGreen: '#10b981',    // Button green (Tailwind green-500)
        navbarGray: '#f9fafb',     // Optional soft navbar background
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Optional clean font
      },
    },
  },
  plugins: [],
}
