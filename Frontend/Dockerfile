# --- Stage 1: Build React App ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy và cài thư viện
COPY package*.json ./
RUN npm install

# Copy source code và tiến hành build
COPY . .
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine

# Xóa trang web mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy cục code tĩnh đã build ở Stage 1 (thư mục dist) sang Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx (Để fix lỗi F5 bị 404 Not Found của React Router)
# Tạo thêm file nginx.conf ở bước tiếp theo
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở cổng 80
EXPOSE 80

# Chạy Nginx ngầm
CMD ["nginx", "-g", "daemon off;"]