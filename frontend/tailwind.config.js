/** @type {import('tailwindcss').Config} */
export default {
<<<<<<< HEAD:frontend/tailwind.config.js
  darkMode: 'class',
=======
  darkMode: "class",
>>>>>>> hotfix:frontend/client/tailwind.config.js
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 필요하다면 js,ts,jsx,tsx 등 확장자에 맞게
  ],
  theme: {
    extend: {
      colors: {
        custom: "#000000", // 필요시 다른 색상 사용
      },
      borderRadius: {
        // .rounded-button 대신 "rounded-button"으로 확장
        button: "0.375rem", // 6px 정도(예시)
      },
    },
  },
  plugins: [],
};
