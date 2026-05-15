/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#22d3ee',
        neonGreen: '#10b981',
        darkBg: '#0f172a',
        darkCard: '#1e293b',
      }
    },
  },
  plugins: [],
}