/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0c0e",
        panel: "#121317",
        text: "#e5e7eb",
        muted: "#9ca3af",
        accent: "#60a5fa"
      }
    }
  },
  plugins: []
};
