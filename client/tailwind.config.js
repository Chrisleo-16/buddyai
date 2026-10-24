/** Design tokens: warm off-white, ink #1E1715 (never #000), muted clinical accents, 4/8px spacing. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: { xs: ['12px', '16px'], sm: ['13px', '18px'], base: ['14px', '20px'], md: ['16px', '22px'], lg: ['18px', '24px'], xl: ['24px', '30px'], '2xl': ['32px', '38px'] },
      colors: {
        ink: { DEFAULT: '#1E1715', strong: '#2B2321', muted: '#6E6461', subtle: '#9A908C' },
        paper: { DEFAULT: '#F7F4EF', raised: '#FFFFFF', sunken: '#F1EDE7', line: '#ECE7E0', hover: '#F4F0EA' },
        ok: { DEFAULT: '#2F7D6D', soft: '#E3F0EC' },
        warn: { DEFAULT: '#B07A2A', soft: '#F6ECDB' },
        danger: { DEFAULT: '#B4483C', soft: '#F6E3E0' },
      },
      borderRadius: { badge: '6px', nav: '8px', btn: '10px', card: '16px', inner: '12px' },
      boxShadow: { card: '0 1px 2px rgba(30,23,21,0.04)', pop: '0 8px 24px rgba(30,23,21,0.08)' },
      keyframes: { in: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } }, shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } } },
      animation: { in: 'in 240ms ease-out both', shimmer: 'shimmer 1.6s linear infinite' },
    },
  },
  plugins: [],
};
