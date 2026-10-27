# 🎓 Smart Center - Hệ Thống Hỗ Trợ Quản Lý Trung Tâm Đào Tạo

> Hệ thống hỗ trợ quản trị trung tâm giáo dục hai nền tảng gồm **Web Portal** (dành cho Admin & Giáo viên) và **Mobile App** (dành cho Phụ huynh).

---

## 📌 Tổng quan dự án

**Smart Center** là giải pháp số hóa toàn diện quy trình vận hành trung tâm đào tạo:
* **Admin / Quản lý:** Quản lý học vụ, nhân sự và tài chính - công nợ.
* **Giáo viên:** Nhận lớp, cập nhật nội dung bài học, ghi nhận xét buổi học và tài liệu đính kèm.
* **Phụ huynh (Mobile App):** Theo dõi tiến độ học tập của con, nhận thông báo kết quả học tập và thanh toán học phí trực tuyến.
---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### **Backend**
* **Framework:** [NestJS](https://nestjs.com/) (Node.js framework)
* **Ngôn ngữ:** TypeScript
* **Database & ORM:** PostgreSQL 15, [Prisma ORM](https://www.prisma.io/)
* **Authentication:** JWT (JSON Web Token), Passport, Role-Based Access Control (RBAC)
* **Real-time & Services:** Socket.IO, Nodemailer (Email), Cloudinary (Lưu trữ tệp/ảnh)
* **Thanh toán:** Cổng thanh toán trực tuyến [PayOS](https://payos.vn/)

### **Frontend (Web Portal - Admin & Giáo viên)**
* **Core:** React 19, TypeScript, Vite
* **UI Library:** Ant Design (v6), React Icons
* **State Management:** Zustand
* **Routing & Networking:** React Router v7, Axios (Interceptors)

### **Mobile App (Ứng dụng Phụ huynh)**
* **Platform:** React Native (0.81), Expo (SDK 54)
* **Navigation:** Expo Router (File-based Routing)
* **UI:** React Native Paper, React Native Reanimated
---

## 📂 Cấu trúc dự án (Monorepo Layout)

```text
smart-center/
├── Backend/                 # NestJS API, Prisma schema, Business Logic
│   ├── prisma/             # Database schema & migrations
│   └── src/                # Modules (auth, class, student, invoice, payment,...)
├── Frontend/                # Web Admin & Teacher Portal (React 19 + Vite + AntD)
├── Mobile/                  # Parent Mobile App (React Native + Expo Router)
└── docker-compose.yaml      # File chạy nhanh DB, Backend và Frontend
```

---

## ✨ Giao diện

### 1. Quản trị (Admin Web)
<p align="center"> 
  <img width="900" alt="Trang chủ" 
    src="https://github.com/user-attachments/assets/dafec174-b356-4be0-b0e0-6de7b7703f93" />
</p>

### 2. Giảng dạy (Teacher Web)
<p align="center"> 
  <img width="900" alt="Cập nhật kết quả buổi học" 
    src="https://github.com/user-attachments/assets/c44c7379-57c7-4a4b-b5f5-8e35b1871d82" />
</p>

### 3. Phụ huynh (Parent Mobile App)
<p align="center"> 
  <img width="280" alt="Kết quả buổi học" src="https://github.com/user-attachments/assets/befa9048-7372-491d-bca7-0fee8f99ccae" />&nbsp;
  <img width="280" alt="Danh sách hóa đơn" src="https://github.com/user-attachments/assets/6f5d7a5c-5cd5-475d-9e8d-4866100fc2b1" />&nbsp;
  <img width="280" alt="Thanh toán QR" src="https://github.com/user-attachments/assets/b7ae9ece-995e-4544-be9f-3bf7682a3e1f" />
</p>


---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### Yêu cầu hệ thống (Prerequisites)
* [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc 20+)
* [Docker & Docker Compose](https://www.docker.com/) (để chạy nhanh)
* [Expo Go](https://expo.dev/go) trên điện thoại (để test Mobile App)

---

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyên dùng)

Chỉ với một câu lệnh, toàn bộ Database (PostgreSQL), Backend API và Frontend Web sẽ được khởi động:

```bash
# 1. Clone repository
git clone https://github.com/TrongNhan04/smart-center.git
cd smart-center

# 2. Khởi chạy toàn bộ hệ thống
docker compose up -d --build
```

* **Frontend Web:** `http://localhost:8080`
* **Backend API:** `http://localhost:3000`
* **PostgreSQL:** `localhost:5432`

---

### Cách 2: Chạy thủ công từng phân hệ (Manual Setup)

#### 1. Backend API
```bash
cd Backend
npm install

# Tạo file .env từ file mẫu và điền thông tin (DB, JWT, PayOS, Cloudinary, Mail)
cp .env.example .env

# Chạy migrate Prisma
npx prisma generate
npx prisma db push

# Chạy server ở chế độ dev
npm run start:dev
```

#### 2. Frontend Web
```bash
cd Frontend
npm install
npm run dev
```
Truy cập: `http://localhost:5173`

#### 3. Mobile App (Expo)
```bash
cd Mobile
npm install
npx expo start
```
* Quét mã QR bằng ứng dụng **Expo Go** trên Android/iOS để trải nghiệm.

---

## ⚙️ Biến môi trường mẫu (`Backend/.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart-center?schema=public"

# JWT Config
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# PayOS Payment Gateway
PAYOS_CLIENT_ID="your_client_id"
PAYOS_API_KEY="your_api_key"
PAYOS_CHECKSUM_KEY="your_checksum_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Nodemailer (Gmail App Password)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
```

---

## 👤 Tác giả

* **Đoàn Trọng Nhân**
* **GitHub:** [@TrongNhan04](https://github.com/TrongNhan04)
* **Email:** [nhan...]@gmail.com
