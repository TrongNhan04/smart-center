# Môi trường sử dựng
FROM node:20-alpine

# Cài đặt thư mục làm việc trong container
WORKDIR /app

# Copy 2 file package vào trước để cài thư viện
COPY package*.json ./

# Copy thư mục prisma vào để generate client
COPY prisma ./prisma/

# Cài đặt các thư viện 
RUN npm install

# Generate Prisma Client 
RUN npx prisma generate

# Copy toàn bộ code còn lại vào container
COPY . .

# Build code NestJS từ TypeScript sang JavaScript
RUN npm run build

# Mở cổng 3000 cho backend
EXPOSE 3000

# Lệnh chạy ứng dụng khi container khởi động
CMD ["npm", "run", "start:prod"]