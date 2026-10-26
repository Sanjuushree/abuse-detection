/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          dark: '#0A0F1D',
          navy: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          violet: '#8B5CF6',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          muted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
