/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scendPink: '#e91e63',  // Adjust this to match your exact pink if needed
        scendGray: '#333333',
      },
    },
  },
  plugins: [],
};
