import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:             'oklch(var(--bg))',
        surface:        'oklch(var(--surface))',
        'surface-2':    'oklch(var(--surface-2))',
        border:         'oklch(var(--border))',
        'border-strong':'oklch(var(--border-strong))',
        fg:             'oklch(var(--fg))',
        'fg-muted':     'oklch(var(--fg-muted))',
        'fg-subtle':    'oklch(var(--fg-subtle))',
        brand: {
          DEFAULT: 'oklch(var(--brand))',
          hover:   'oklch(var(--brand-hover))',
          fg:      'oklch(var(--brand-fg))',
        },
        success: 'oklch(var(--success))',
        warning: 'oklch(var(--warning))',
        danger:  'oklch(var(--danger))',
        info:    'oklch(var(--info))',

        // shadcn compat
        background:   'oklch(var(--bg))',
        foreground:   'oklch(var(--fg))',
        card:         { DEFAULT: 'oklch(var(--surface))', foreground: 'oklch(var(--fg))' },
        primary:      { DEFAULT: 'oklch(var(--brand))', foreground: 'oklch(var(--brand-fg))' },
        muted:        { DEFAULT: 'oklch(var(--surface-2))', foreground: 'oklch(var(--fg-muted))' },
        destructive:  { DEFAULT: 'oklch(var(--danger))', foreground: 'oklch(0.98 0.005 50)' },
        accent:       { DEFAULT: 'oklch(var(--surface-2))', foreground: 'oklch(var(--fg))' },
        input:        'oklch(var(--border))',
        ring:         'oklch(var(--brand))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui'],
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 2px)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
}

export default config
