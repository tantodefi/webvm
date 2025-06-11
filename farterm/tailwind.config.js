/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#1a1b26',
          text: '#a9b1d6',
          cursor: '#c0caf5',
          selection: '#33467c',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} 