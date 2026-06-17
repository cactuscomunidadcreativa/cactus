import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Cactus brand
        cactus: {
          green: '#3E8E40',
          'green-light': '#79BB74',
        },
        // Ramona brand
        ramona: {
          purple: '#9A4E9A',
          pink: '#FFA4E9',
        },
        // PITA brand - OWN YOUR IMPACT palette
        pita: {
          deep: '#0E1B2C',
          forest: '#1F3D36',
          green: '#4FAF8F',
          blue: '#2D6CDF',
          gold: '#C7A54A',
          light: '#F5F7F9',
        },
        // CEREUS brand - Noir & Gold Atelier
        cereus: {
          noir: '#0A0A0A',
          'noir-light': '#1F1F1F',
          gold: '#B8943A',
          'gold-light': '#D4B04E',
          ivory: '#F0EBE0',
          bordeaux: '#6B1D34',
          charcoal: '#383838',
          silver: '#BFBFBF',
          cream: '#F7F5F0',
        },
        // Maison white-label (dynamic CSS variables, set per-tenant)
        maison: {
          primary: 'var(--maison-primary, #0A0A0A)',
          accent: 'var(--maison-accent, #B8943A)',
          bg: 'var(--maison-bg, #FFFFFF)',
          text: 'var(--maison-text, #0A0A0A)',
        },
        // EQ LATAM brand - Trust Blue & Premium Gold
        eq: {
          blue: '#1E6B8A',
          'blue-light': '#2D8CB0',
          'blue-dark': '#14516B',
          gold: '#C4A035',
          'gold-light': '#D4B84E',
          navy: '#0F2B3D',
          teal: '#1A8A7A',
          cream: '#FBF8F0',
        },
        // Shared
        accent: {
          DEFAULT: '#F99330',
          dark: '#F99130',
        },
        // UI system colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        editorial: ['Playfair Display', 'Georgia', 'serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'orbit-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 25px) scale(0.95)' },
        },
        // ── Cactus: vida propia de cada agente ──
        'cactus-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'cactus-wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-4deg)' },
          '40%': { transform: 'rotate(3deg)' },
          '60%': { transform: 'rotate(-2deg)' },
          '80%': { transform: 'rotate(2deg)' },
        },
        'cactus-bounce': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '30%': { transform: 'translateY(-10px) scale(1.04)' },
          '55%': { transform: 'translateY(0) scale(0.98)' },
          '75%': { transform: 'translateY(-4px) scale(1.01)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 36s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'orbit-drift': 'orbit-drift 18s ease-in-out infinite',
        'cactus-float': 'cactus-float 4s ease-in-out infinite',
        'cactus-wiggle': 'cactus-wiggle 0.7s ease-in-out',
        'cactus-bounce': 'cactus-bounce 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
