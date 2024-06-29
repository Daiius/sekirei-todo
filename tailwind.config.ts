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
        'tail-wag': 'tail-wag-keyframes 5s infinite',
      },
      keyframes: {
        'tail-wag-keyframes': {
          '0%,4%,8%,100%'  : { transform: 'rotate(0deg)' },
          '2%,6%' : { transform: 'rotate(25deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
