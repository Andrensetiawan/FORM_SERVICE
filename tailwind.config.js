/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ⬇️ OPTIONAL tapi berguna untuk konsistensi customization
      colors: {
        accent: "var(--accent-color)",
        "accent-hover": "var(--hover-accent-color)",
      },

      fontSize: {
        base: "var(--base-font-size)",
      },
    },
  },

  safelist: [
    // ⬇️ Ini penting karena kamu pakai class dinamis
    "dark",
  ],

  plugins: [],
};
