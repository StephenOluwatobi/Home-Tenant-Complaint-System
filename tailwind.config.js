/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#1d2a33',
        paper: '#f4f6f7',
        line: '#d9dfe3',
        door: { DEFAULT: '#0f6b6b', dark: '#0a5252', soft: '#e1f0ef' },
        pending: { DEFAULT: '#a15c00', soft: '#fdf0dc' },
        progress: { DEFAULT: '#1f5fa8', soft: '#e3eefa' },
        resolved: { DEFAULT: '#1f7a45', soft: '#e0f3e8' },
      },
    },
  },
  plugins: [],
}
