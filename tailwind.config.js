/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scendPink: "#ff4f8b",
        scendGrey: "#f3f4f6",
        textDark: "#1f2937",
        buttonBlue: "#3b82f6",
        buttonGreen: "#10b981",
        buttonGrey: "#6b7280"
      },
    },
  },
  plugins: [],
}
