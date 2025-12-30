import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        code: {
          DEFAULT: 'hsl(var(--code-background))',
          foreground: 'hsl(var(--code-foreground))',
          header: 'hsl(var(--code-header))',
          border: 'hsl(var(--code-border))',
          'line-number': 'hsl(var(--code-line-number))',
          'copy-button': 'hsl(var(--code-copy-button))',
          'copy-button-hover': 'hsl(var(--code-copy-button-hover))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        // Headings
        'heading-72': [
          'var(--heading-72-size)',
          {
            lineHeight: 'var(--heading-72-line)',
            letterSpacing: 'var(--heading-72-tracking)',
            fontWeight: 'var(--heading-72-weight)',
          },
        ],
        'heading-64': [
          'var(--heading-64-size)',
          {
            lineHeight: 'var(--heading-64-line)',
            letterSpacing: 'var(--heading-64-tracking)',
            fontWeight: 'var(--heading-64-weight)',
          },
        ],
        'heading-56': [
          'var(--heading-56-size)',
          {
            lineHeight: 'var(--heading-56-line)',
            letterSpacing: 'var(--heading-56-tracking)',
            fontWeight: 'var(--heading-56-weight)',
          },
        ],
        'heading-48': [
          'var(--heading-48-size)',
          {
            lineHeight: 'var(--heading-48-line)',
            letterSpacing: 'var(--heading-48-tracking)',
            fontWeight: 'var(--heading-48-weight)',
          },
        ],
        'heading-40': [
          'var(--heading-40-size)',
          {
            lineHeight: 'var(--heading-40-line)',
            letterSpacing: 'var(--heading-40-tracking)',
            fontWeight: 'var(--heading-40-weight)',
          },
        ],
        'heading-32': [
          'var(--heading-32-size)',
          {
            lineHeight: 'var(--heading-32-line)',
            letterSpacing: 'var(--heading-32-tracking)',
            fontWeight: 'var(--heading-32-weight)',
          },
        ],
        'heading-24': [
          'var(--heading-24-size)',
          {
            lineHeight: 'var(--heading-24-line)',
            letterSpacing: 'var(--heading-24-tracking)',
            fontWeight: 'var(--heading-24-weight)',
          },
        ],
        'heading-20': [
          'var(--heading-20-size)',
          {
            lineHeight: 'var(--heading-20-line)',
            letterSpacing: 'var(--heading-20-tracking)',
            fontWeight: 'var(--heading-20-weight)',
          },
        ],
        'heading-16': [
          'var(--heading-16-size)',
          {
            lineHeight: 'var(--heading-16-line)',
            letterSpacing: 'var(--heading-16-tracking)',
            fontWeight: 'var(--heading-16-weight)',
          },
        ],
        'heading-14': [
          'var(--heading-14-size)',
          {
            lineHeight: 'var(--heading-14-line)',
            letterSpacing: 'var(--heading-14-tracking)',
            fontWeight: 'var(--heading-14-weight)',
          },
        ],
        // Labels
        'label-20': [
          'var(--label-20-size)',
          {
            lineHeight: 'var(--label-20-line)',
            letterSpacing: 'var(--label-20-tracking)',
            fontWeight: 'var(--label-20-weight)',
          },
        ],
        'label-16': [
          'var(--label-16-size)',
          {
            lineHeight: 'var(--label-16-line)',
            letterSpacing: 'var(--label-16-tracking)',
            fontWeight: 'var(--label-16-weight)',
          },
        ],
        'label-14': [
          'var(--label-14-size)',
          {
            lineHeight: 'var(--label-14-line)',
            letterSpacing: 'var(--label-14-tracking)',
            fontWeight: 'var(--label-14-weight)',
          },
        ],
        'label-13': [
          'var(--label-13-size)',
          {
            lineHeight: 'var(--label-13-line)',
            letterSpacing: 'var(--label-13-tracking)',
            fontWeight: 'var(--label-13-weight)',
          },
        ],
        'label-12': [
          'var(--label-12-size)',
          {
            lineHeight: 'var(--label-12-line)',
            letterSpacing: 'var(--label-12-tracking)',
            fontWeight: 'var(--label-12-weight)',
          },
        ],
        // Copy (Body)
        'copy-24': [
          'var(--copy-24-size)',
          {
            lineHeight: 'var(--copy-24-line)',
            letterSpacing: 'var(--copy-24-tracking)',
            fontWeight: 'var(--copy-24-weight)',
          },
        ],
        'copy-20': [
          'var(--copy-20-size)',
          {
            lineHeight: 'var(--copy-20-line)',
            letterSpacing: 'var(--copy-20-tracking)',
            fontWeight: 'var(--copy-20-weight)',
          },
        ],
        'copy-16': [
          'var(--copy-16-size)',
          {
            lineHeight: 'var(--copy-16-line)',
            letterSpacing: 'var(--copy-16-tracking)',
            fontWeight: 'var(--copy-16-weight)',
          },
        ],
        'copy-14': [
          'var(--copy-14-size)',
          {
            lineHeight: 'var(--copy-14-line)',
            letterSpacing: 'var(--copy-14-tracking)',
            fontWeight: 'var(--copy-14-weight)',
          },
        ],
        'copy-13': [
          'var(--copy-13-size)',
          {
            lineHeight: 'var(--copy-13-line)',
            letterSpacing: 'var(--copy-13-tracking)',
            fontWeight: 'var(--copy-13-weight)',
          },
        ],
        // Button
        'button-16': [
          'var(--button-16-size)',
          {
            lineHeight: 'var(--button-16-line)',
            letterSpacing: 'var(--button-16-tracking)',
            fontWeight: 'var(--button-16-weight)',
          },
        ],
        'button-14': [
          'var(--button-14-size)',
          {
            lineHeight: 'var(--button-14-line)',
            letterSpacing: 'var(--button-14-tracking)',
            fontWeight: 'var(--button-14-weight)',
          },
        ],
        'button-12': [
          'var(--button-12-size)',
          {
            lineHeight: 'var(--button-12-line)',
            letterSpacing: 'var(--button-12-tracking)',
            fontWeight: 'var(--button-12-weight)',
          },
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-left': 'slide-out-left 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [typography],
};

export default config;
