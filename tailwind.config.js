/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acrobat: {
          dark: '#1e1e1e',
          darker: '#141414',
          panel: '#252526',
          border: '#333333',
          red: '#ed2224',
          accent: '#2670e8',
        }
      }
    },
  },
  plugins: [],
}
