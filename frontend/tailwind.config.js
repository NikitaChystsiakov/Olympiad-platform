/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        serif: ['Literata', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        muted: token('muted'),
        line: token('line'),
        ink: token('ink'),
        fg: token('fg'),
        soft: token('soft'),
        accent: { DEFAULT: token('accent'), strong: token('accent-strong'), soft: token('accent-soft') },
        marker: token('marker'),
        risk: {
          high: token('risk-high'),
          'high-bg': token('risk-high-bg'),
          mid: token('risk-mid'),
          'mid-bg': token('risk-mid-bg'),
          low: token('risk-low'),
          'low-bg': token('risk-low-bg'),
        },
      },
      borderRadius: {
        control: '10px',
        chip: '14px',
        card: '20px',
      },
      boxShadow: {
        lift: '0 1px 2px rgb(20 24 27 / 0.04), 0 8px 24px -12px rgb(20 24 27 / 0.12)',
        float: '0 2px 6px rgb(20 24 27 / 0.05), 0 40px 80px -40px rgb(20 24 27 / 0.35)',
      },
      fontSize: {
        display: ['4rem', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
        'display-sm': ['2.375rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        rise: 'rise 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
