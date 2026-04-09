import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7f4',
          100: '#d7ede4',
          200: '#b0dbc9',
          300: '#80c2a8',
          400: '#4fa485',
          500: '#2d8a6a',
          600: '#1e6e53',
          700: '#185843',
          800: '#144636',
          900: '#0f3628',
        },
        earth: {
          100: '#f5f0e8',
          200: '#e8ddc8',
          300: '#d4c4a0',
          400: '#b8a070',
          500: '#9a7d48',
          600: '#7a6038',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
