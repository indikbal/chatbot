/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: { brand: "var(--ac-brand)", brand2: "var(--ac-brand2)" },
      keyframes: {
        blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "96%": { transform: "scaleY(0.1)" } },
        ring: { "0%": { transform: "scale(1)", opacity: ".45" }, "100%": { transform: "scale(1.7)", opacity: "0" } },
        dot: { "0%,80%,100%": { transform: "translateY(0)", opacity: ".4" }, "40%": { transform: "translateY(-5px)", opacity: "1" } },
        wave: { "0%,60%,100%": { transform: "rotate(0)" }, "10%,30%": { transform: "rotate(16deg)" }, "20%,40%": { transform: "rotate(-8deg)" }, "50%": { transform: "rotate(10deg)" } },
      },
      animation: {
        blink: "blink 4.5s infinite",
        ring: "ring 2.4s ease-out infinite",
        dot: "dot 1.1s infinite",
        wave: "wave 2.2s ease-in-out infinite",
      },
    },
  },
};
