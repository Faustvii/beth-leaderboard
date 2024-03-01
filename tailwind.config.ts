import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,tsx}"],
  darkMode: "media",
  theme: {
    fontFamily: {
      "roboto-mono": ['"Raleway"', "sans-serif"],
    },
    extend: {
      colors: {
        primary: "#ff8906",
      },
      screens: {
        'tall': { 'raw': '(min-height: 1920px)' },
      },
    },
  },
  plugins: [],
} satisfies Config;
