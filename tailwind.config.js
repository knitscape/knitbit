/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      fontFamily: {
        park: ['"National Park"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
