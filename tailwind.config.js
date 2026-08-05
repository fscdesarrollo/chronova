/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1f2e',
        header: '#252b3b',
        sprint: {
          dev: '#3d4455',
          dev2: '#343a4a',
          innovation: '#6b4c9a',
          planning: '#1e2230',
        },
      },
    },
  },
  plugins: [],
}
