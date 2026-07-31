/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F97316",
          soft: "#FB923C",
          deep: "#C2410C",
        },
        family: {
          blue: "#0066CC",
          green: "#00A86B",
        },
        ink: {
          DEFAULT: "#141414",
          muted: "#666666",
          subtle: "#F4F5F0",
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
