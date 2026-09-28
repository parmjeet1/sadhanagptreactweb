/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Palette + fonts used by the SadhnaAssistant chat widget
      // (src/sadhna-assistant) — ported from its Tailwind v4 @theme block
      // (src/sadhna-assistant's own index.css) into this project's v3 config.
      colors: {
        saffron: {
          50: '#fdf6ee',
          100: '#faebd4',
          200: '#f4d4a8',
          300: '#edb76f',
          400: '#e6993f',
          500: '#dd7f22',
          600: '#c4651a',
          700: '#a34d18',
          800: '#833f1a',
          900: '#6b3519',
        },
        cream: {
          50: '#fffdf8',
          100: '#fdf8ee',
          200: '#faf0d9',
          300: '#f5e4bd',
        },
        gold: {
          300: '#ecd18f',
          400: '#ddb35a',
          500: '#c99a3e',
        },
        leaf: {
          100: '#e7efdd',
          200: '#cfe0bd',
          300: '#aecb92',
          400: '#8fb672',
          500: '#729957',
        },
      },
      fontFamily: {
        display: ['Poppins', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}