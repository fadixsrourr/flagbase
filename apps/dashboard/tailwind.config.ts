import type { Config } from 'tailwindcss'

/**
 * "Carbon & Signal" — a dark, instrument-panel theme for FlagBase.
 * Tokens are defined as space-separated RGB channels in globals.css so that
 * Tailwind opacity utilities (e.g. bg-accent/10) keep working. One locked
 * accent (signal amber); neutrals are a cool carbon, never slate.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        carbon: token('carbon'),
        surface: {
          DEFAULT: token('surface'),
          raised: token('surface-raised'),
          hover: token('surface-hover'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        content: {
          DEFAULT: token('text'),
          muted: token('text-muted'),
          faint: token('text-faint'),
        },
        accent: {
          DEFAULT: token('accent'),
          bright: token('accent-bright'),
          ink: token('accent-ink'),
        },
        brand: {
          navy: token('brand-navy'),
        },
        danger: {
          DEFAULT: token('danger'),
          ink: token('danger-ink'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        control: '0.5rem',
        panel: '0.875rem',
      },
      boxShadow: {
        edge: 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
        panel: '0 24px 70px -28px rgb(0 0 0 / 0.75)',
        'accent-focus': '0 0 0 1px rgb(var(--accent) / 0.55), 0 0 22px -4px rgb(var(--accent) / 0.45)',
      },
      keyframes: {
        'signal-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgb(var(--accent) / 0.5)' },
          '50%': { opacity: '0.55', boxShadow: '0 0 0 6px rgb(var(--accent) / 0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'signal-pulse': 'signal-pulse 2.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}

export default config
