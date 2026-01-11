/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          cyber: {
            black: '#0a0a0f',
            dark: '#12121a',
            panel: '#1a1a24',
            primary: '#00f0ff', // Cyan Neon
            accent: '#7000ff',  // Purple Neon
            danger: '#ff003c',  // Red Neon
            success: '#00ff9f', // Green Neon
            text: '#e0e0e0',
            muted: '#858595'
          }
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        boxShadow: {
            'neon-blue': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
            'neon-purple': '0 0 10px rgba(112, 0, 255, 0.5), 0 0 20px rgba(112, 0, 255, 0.3)',
        }
      },
    },
    plugins: [],
  }
