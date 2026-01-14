import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // แนะนำให้เพิ่มบรรทัดนี้ครับ เพื่อเปิดรับการเชื่อมต่อจาก Docker ได้ชัวร์ๆ
    port: 5173,
    proxy: {
      '/api': {
        // ❌ ของเดิม: target: 'http://localhost:3000',
        // ✅ แก้เป็น:
        target: 'http://backend:3000', 
        changeOrigin: true,
      },
    },
  },
})