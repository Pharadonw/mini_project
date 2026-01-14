# 1. ใช้ Node เวอร์ชั่นเดียวกับ Backend (เพื่อความเข้ากันได้)
FROM node:lts-alpine

# 2. ตั้งค่าเป็น Development
ENV NODE_ENV=development

WORKDIR /app

# 3. Copy ไฟล์ package
COPY ["package.json", "package-lock.json*", "./"]

# 4. ลง dependency ทั้งหมด (รวม devDependencies ด้วย)
RUN npm install

# 5. Copy โค้ดที่เหลือ
COPY . .

# 6. เปลี่ยนเจ้าของไฟล์ (Good Practice เหมือนฝั่ง Backend)
RUN chown -R node /app
USER node

# 7. เปิด Port (Vite ปกติใช้ 5173, Create-React-App ใช้ 3000)
# ถ้าไม่แน่ใจ ให้เช็คตอนรันปกติว่ามันขึ้น Port อะไร แล้วแก้เลขตรงนี้ให้ตรงครับ
EXPOSE 5173

# 8. คำสั่งรัน
# สำคัญ: ต้องเติม -- --host เพื่อให้ Docker ยอมให้เราเข้าถึงเว็บจาก Browser เครื่องเราได้
CMD ["npm", "run", "dev", "--", "--host"]