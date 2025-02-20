import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // 개발 서버 구동 시 자동으로 브라우저 열기 (선택)
    proxy: {
      '/api': {
        target: 'https://msteam5iseeu.ddns.net',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});
