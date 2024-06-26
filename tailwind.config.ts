import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/stories/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
        "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        'tail-wag': 'tail-wag-keyframes 1s infinite',
      },
      keyframes: {
        'tail-wag-keyframes': {
          '0%'  : { transform: 'rotate(0deg)' },
          '50%' : { transform: 'rotate(45deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
