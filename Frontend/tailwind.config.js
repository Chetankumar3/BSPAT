/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base:     '#0a0b0d',
          card:     '#111318',
          elevated: '#181b22',
          overlay:  '#1f232d',
        },
        edge: {
          DEFAULT: '#252932',
          hi:      '#2e3340',
        },
        accent: {
          DEFAULT: '#f0a500',
          hi:      '#fbb620',
          muted:   'rgba(240,165,0,0.12)',
        },
        positive: {
          DEFAULT: '#3ecf8e',
          muted:   'rgba(62,207,142,0.1)',
        },
        negative: {
          DEFAULT: '#f06060',
          muted:   'rgba(240,96,96,0.1)',
        },
        info:  '#5b8af0',
        lilac: '#a78bfa',
        ink: {
          bright: '#e8eaf0',
          mid:    '#9ca3b0',
          dim:    '#5c6370',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease forwards',
        'fade-up':  'fadeUp 0.2s ease forwards',
      },
    },
  },
  plugins: [],
};
