/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        scendPink: "#EC4899",  // You can replace this with your preferred shade
        scendGrey: "#F3F4F6",  // Light grey background
        buttonGrey: "#6B7280", // Darker grey for buttons if needed
        buttonGreen: "#10B981"
      }
    }
  },
  plugins: []
}
