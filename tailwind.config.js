/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'card': '#ffffff',
        'card-foreground': '#1f2937',
        'border': '#e5e7eb',
      },
    },
  },
  plugins: [],
}
