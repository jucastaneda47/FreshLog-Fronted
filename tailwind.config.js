/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        alacena: {
          dark: "#0f2744",
          darker: "#0a1c33",
          accent: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};
