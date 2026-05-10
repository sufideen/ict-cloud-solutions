/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        az:       '#0078D4',
        'az-dark':'#005A9E',
        'az-light':'#50ABF1',
        'az-dim': '#003F72',
        cf:       '#F6821F',
        em:       '#00BCF2',
        s:        '#070D17',
        s2:       '#0B1220',
        s3:       '#101828',
        tx:       '#DCE8F8',
        mu:       '#5A7A9E',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
