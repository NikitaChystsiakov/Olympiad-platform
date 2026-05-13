/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#101828',
        mist: '#f5f7fb',
        ocean: '#0d5bd7',
        tide: '#0f172a',
        mint: '#14b8a6',
        ember: '#f97316',
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(circle at top left, rgba(20, 184, 166, 0.28), transparent 35%), radial-gradient(circle at top right, rgba(13, 91, 215, 0.22), transparent 40%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,247,251,0.92))',
        'hero-mesh-dark':
          'radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 35%), radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 40%), linear-gradient(135deg, rgba(2, 6, 23, 0.96), rgba(15, 23, 42, 0.94))',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floatIn: 'floatIn 0.45s ease-out forwards',
      },
    },
  },
  plugins: [],
};
