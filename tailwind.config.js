/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        // Editorial Color System
        background: '#F9F9F9',
        foreground: '#111111',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111111',
        },
        primary: {
          DEFAULT: '#2A2A2A',
          foreground: '#F9F9F9',
          hover: '#111111',
        },
        secondary: {
          DEFAULT: '#EAEAEA',
          foreground: '#111111',
          hover: '#DCDCDC',
        },
        muted: {
          DEFAULT: '#EAEAEA',
          foreground: '#666666',
        },
        accent: {
          DEFAULT: '#EAEAEA',
          foreground: '#111111',
          hover: '#DCDCDC',
        },
        destructive: {
          DEFAULT: '#AD2B2F',
          foreground: '#F9F9F9',
          hover: '#8B2226',
        },
        success: {
          DEFAULT: '#2A5A2A',
          foreground: '#F9F9F9',
          hover: '#1F4A1F',
        },
        warning: {
          DEFAULT: '#8B6914',
          foreground: '#F9F9F9',
          hover: '#6B5010',
        },
        border: '#DCDCDC',
        input: '#DCDCDC',
        ring: '#2A2A2A',
      },
      borderRadius: {
        lg: '0rem',
        md: '0rem',
        sm: '0rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      letterSpacing: {
        'wider': '0.05em',
        'widest': '0.1em',
      },
      lineHeight: {
        'extra-tight': '1.1',
        'extra-loose': '2',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};