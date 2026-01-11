import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
