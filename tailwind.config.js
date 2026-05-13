/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50:  '#f7f6f3',
          100: '#eeecea',
          200: '#dddad5',
          300: '#c5c0b8',
          400: '#a89f94',
          500: '#8c8278',
          600: '#736960',
          700: '#5e554d',
          800: '#4e4640',
          900: '#433c37',
          950: '#231f1c',
        },
        // Dark mode purple palette
        night: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4caff',
          300: '#b8a9ff',
          400: '#9d87ff',
          500: '#8b6fff',
          600: '#7c52f5',
          700: '#6b3de0',
          800: '#5a31bb',
          900: '#4a2898',
          950: '#1a0a3d',
        },
        accent: {
          DEFAULT: '#c17f3e',
          light:   '#d4975a',
          dark:    '#a06830',
        },
        // Purple accent for dark mode
        violet: {
          DEFAULT: '#a78bfa',
          light:   '#c4b5fd',
          dark:    '#7c3aed',
          glow:    '#8b5cf6',
        },
      },
      backgroundImage: {
        'night-gradient': 'linear-gradient(135deg, #1a0a3d 0%, #0f0720 50%, #1a0a3d 100%)',
        'purple-glow': 'radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 60%)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.serif').join(', '),
            color: theme('colors.ink.800'),
            lineHeight: '1.85',
            fontSize: '1.0625rem',
            'h1,h2,h3,h4': {
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
              color: theme('colors.ink.900'),
            },
            a: {
              color: theme('colors.accent.DEFAULT'),
              textDecoration: 'underline',
              textDecorationColor: 'transparent',
              transition: 'text-decoration-color 200ms',
              '&:hover': { textDecorationColor: theme('colors.accent.DEFAULT') },
            },
            blockquote: {
              borderLeftColor: theme('colors.accent.DEFAULT'),
              borderLeftWidth: '3px',
              fontStyle: 'italic',
              color: theme('colors.ink.600'),
            },
            hr: { borderColor: theme('colors.ink.200') },
            code: {
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875em',
              backgroundColor: theme('colors.ink.100'),
              padding: '0.15em 0.4em',
              borderRadius: '0.25rem',
            },
          },
        },
        invert: {
          css: {
            color: '#d4caff',
            'h1,h2,h3,h4': { color: '#f3f0ff' },
            blockquote: {
              borderLeftColor: '#a78bfa',
              color: '#b8a9ff',
            },
            code: { backgroundColor: 'rgba(139,92,246,0.15)' },
            hr: { borderColor: 'rgba(167,139,250,0.2)' },
            a: {
              color: '#a78bfa',
              '&:hover': { textDecorationColor: '#a78bfa' },
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
