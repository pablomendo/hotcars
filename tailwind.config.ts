import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        foreground: "#020617",
        border: "#e2e8f0",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
