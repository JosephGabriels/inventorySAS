/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#151b29',
        surface: '#1a1f2e',
        'surface-light': '#232838',
        primary: {
          DEFAULT: '#f97316',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F97316', // Main orange
          600: '#EA580C',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          700: '#2D3748', // Grey
          800: '#1A202C', // Darker grey
          900: '#111827', // Almost black
        },
        gray: {
          800: '#1a202c',
          900: '#171923',
        },
        orange: {
          400: '#ff8a4c',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
      boxShadow: {
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        glow: '0 0 20px rgba(249, 115, 22, 0.15)',
      },
      ringColor: {
        'orange': {
          '500': 'rgba(249, 115, 22, 0.5)',
        }
      },
      transitionProperty: {
        'input': 'border-color, box-shadow, background-color',
      },
    },
  },
  plugins: [],
};