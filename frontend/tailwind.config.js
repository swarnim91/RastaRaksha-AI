/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'rr-bg': '#080B0E',
        'rr-surface': '#111518',
        'rr-card': '#161B20',
        'rr-card-hover': '#1C2228',
        'rr-red': '#E53935',
        'rr-amber': '#FF9800',
        'rr-green': '#00C853',
        'rr-blue': '#2196F3',
        'rr-text': '#F5F5F5',
        'rr-text-secondary': '#8B9299',
        'rr-text-muted': '#4A5058',
        'rr-border': 'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulseRed 0.8s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'gauge-fill': 'gaugeFill 1.5s ease-out forwards',
        'flash-yellow': 'flashYellow 0.4s ease-out',
        'live-pulse': 'livePulse 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'banner-pulse': 'bannerPulse 2s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'speed-glow': 'speedGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4', boxShadow: '0 0 30px rgba(229,57,53,0.6)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        gaugeFill: {
          '0%': { strokeDashoffset: '452.39' },
        },
        flashYellow: {
          '0%': { backgroundColor: 'rgba(255,152,0,0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bannerPulse: {
          '0%, 100%': { backgroundColor: 'rgba(229,57,53,0.9)' },
          '50%': { backgroundColor: 'rgba(229,57,53,0.6)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        speedGlow: {
          '0%, 100%': { textShadow: '0 0 20px rgba(245,245,245,0.3)' },
          '50%': { textShadow: '0 0 40px rgba(245,245,245,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
