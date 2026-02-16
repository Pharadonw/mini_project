import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy' // 1. นำเข้า plugin

export default defineConfig({
  plugins: [
    react(),
    // 2. ตั้งค่า Legacy เพื่อให้รันบนกล่อง Android เก่าๆ ได้ (แก้จอดำ)
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 7'], 
    }),
  ],
  server: {
    host: true, // เปิดให้เครื่องอื่น (กล่อง) เข้ามาได้
    port: 5173,
    proxy: {
      '/api': {
        // เลือกว่าจะต่อ Backend ที่ไหน (Docker หรือ Local)
        // target: 'http://backend:3000', // ถ้าใช้ Docker (ชื่อ Container)
        target: 'http://localhost:3000',  // ถ้าใช้รันบนเครื่องตัวเอง (Node.js ปกติ)
        changeOrigin: true,
        secure: false,
      },
    },
  },
})