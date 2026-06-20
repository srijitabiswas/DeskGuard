/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F8FA',
        surface: '#FFFFFF',
        's2': '#F1F5F9',
        border: '#E2E8F0',
        'border-2': '#CBD5E1',
        t1: '#0F172A',
        t2: '#475569',
        t3: '#94A3B8',
        accent: { DEFAULT: '#2563EB', soft: '#EFF6FF', hover: '#1D4ED8' },
        safe: { DEFAULT: '#059669', soft: '#ECFDF5' },
        warn: { DEFAULT: '#D97706', soft: '#FFFBEB' },
        alert: { DEFAULT: '#DC2626', soft: '#FEF2F2' },
        violet: { DEFAULT: '#7C3AED', soft: '#F5F3FF' },
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Inter', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.10)',
        overlay: '0 20px 60px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
