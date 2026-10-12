/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta semántica de la app
        brand: {
          blue: '#3b82f6',
          cyan: '#22d3ee',
          deep: '#1e40af',
        },
      },
      boxShadow: {
        // Tarjetas con profundidad sutil
        card: '0 1px 2px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(39,39,42,0.4)',
        'card-hover':
          '0 8px 24px -6px rgba(59,130,246,0.18), 0 0 0 1px rgba(59,130,246,0.25)',
        // Glows de marca
        'glow-blue': '0 0 20px -2px rgba(59,130,246,0.45)',
        'glow-cyan': '0 0 20px -2px rgba(34,211,238,0.45)',
        'glow-soft': '0 0 32px -6px rgba(34,211,238,0.25)',
        // CTA
        cta: '0 4px 14px 0 rgba(59,130,246,0.35)',
        'cta-hover': '0 6px 20px 0 rgba(59,130,246,0.45)',
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)',
        'grad-brand-soft':
          'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(34,211,238,0.15) 100%)',
        'grad-card':
          'linear-gradient(160deg, rgba(24,24,27,0.9) 0%, rgba(24,24,27,0.5) 100%)',
        'grad-radial':
          'radial-gradient(ellipse at top, rgba(59,130,246,0.12), transparent 60%)',
      },
      keyframes: {
        'pulse-blue': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.7)' },
          '50%': { boxShadow: '0 0 0 14px rgba(34,211,238,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'pulse-blue': 'pulseBlue 1.4s ease-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'scale-in': 'scaleIn 180ms ease-out',
      },
    },
  },
  plugins: [],
};