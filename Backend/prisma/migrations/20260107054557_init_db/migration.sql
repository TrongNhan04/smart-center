-- CreateEnum
CREATE TYPE "Vaitro" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "TrangThaiGV" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TrangThaiHV" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TrangThaiKH" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TrangThaiLH" AS ENUM ('OPEN', 'RUNNING', 'CLOSED');

-- CreateEnum
CREATE TYPE "TrangThaiBH" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrangThai_KQBH" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "TrangThai_GD" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "ID" SERIAL NOT NULL,
    "Email" TEXT NOT NULL,
    "DienThoai" TEXT NOT NULL,
    "MatKhauHash" TEXT NOT NULL,
    "PhaiDoiMK" BOOLEAN NOT NULL DEFAULT true,
    "VaiTro" "Vaitro" NOT NULL,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "GiaoVien" (
    "ID" SERIAL NOT NULL,
    "MaGiaoVien" TEXT NOT NULL,
    "UserID" INTEGER NOT NULL,
    "HoTen" TEXT NOT NULL,
    "ChuyenMon" TEXT,
    "GhiChu" TEXT,
    "TrangThai" "TrangThaiGV" NOT NULL DEFAULT 'ACTIVE',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GiaoVien_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "HocVien" (
    "ID" SERIAL NOT NULL,
    "MaHocVien" TEXT NOT NULL,
    "UserID" INTEGER NOT NULL,
    "TenHocVien" TEXT NOT NULL,
    "TenPhuHuynh" TEXT NOT NULL,
    "NgaySinh" TIMESTAMP(3) NOT NULL,
    "DiaChi" TEXT,
    "GhiChu" TEXT,
    "TrangThai" "TrangThaiHV" NOT NULL DEFAULT 'ACTIVE',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HocVien_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "KhoaHoc" (
    "ID" SERIAL NOT NULL,
    "MaKhoaHoc" TEXT NOT NULL,
    "TenKhoaHoc" TEXT NOT NULL,
    "TrinhDo" TEXT NOT NULL,
    "ThoiGian" INTEGER NOT NULL,
    "TongSoBuoi" INTEGER NOT NULL,
    "HocPhi" DECIMAL(10,2) NOT NULL,
    "TrangThai" "TrangThaiKH" NOT NULL DEFAULT 'DRAFT',
    "MoTa" TEXT,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KhoaHoc_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "LopHoc" (
    "ID" SERIAL NOT NULL,
    "MaLopHoc" TEXT NOT NULL,
    "KhoaHocID" INTEGER NOT NULL,
    "GiaoVienID" INTEGER NOT NULL,
    "TenLop" TEXT NOT NULL,
    "MoTa" TEXT,
    "TuNgay" TIMESTAMP(3) NOT NULL,
    "DenNgay" TIMESTAMP(3) NOT NULL,
    "LichHoc" INTEGER[],
    "GioBatDau" TEXT NOT NULL,
    "GioKetThuc" TEXT NOT NULL,
    "SiSo" INTEGER NOT NULL,
    "PhongHoc" TEXT,
    "TrangThai" "TrangThaiLH" NOT NULL DEFAULT 'OPEN',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LopHoc_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "BuoiHoc" (
    "ID" SERIAL NOT NULL,
    "LopHocID" INTEGER NOT NULL,
    "BuoiSo" INTEGER NOT NULL,
    "ChuDe" TEXT,
    "BatDauLuc" TIMESTAMP(3) NOT NULL,
    "KetThucLuc" TIMESTAMP(3) NOT NULL,
    "MoTa" TEXT,
    "PhongHoc" TEXT,
    "TrangThai" "TrangThaiBH" NOT NULL DEFAULT 'SCHEDULED',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BuoiHoc_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "KetQua_BuoiHoc" (
    "ID" SERIAL NOT NULL,
    "BuoiHocID" INTEGER NOT NULL,
    "GiaoVienID" INTEGER NOT NULL,
    "NhanXetChung" TEXT NOT NULL,
    "TrangThai" "TrangThai_KQBH" NOT NULL DEFAULT 'DRAFT',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KetQua_BuoiHoc_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "KetQua_ChiTiet" (
    "ID" SERIAL NOT NULL,
    "KetQuaID" INTEGER NOT NULL,
    "GhiDanhID" INTEGER NOT NULL,
    "NhanXetRieng" TEXT,
    "DiemDanh" BOOLEAN NOT NULL,
    "Diem" DECIMAL(4,2) NOT NULL,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "KetQua_ChiTiet_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "GhiDanh" (
    "ID" SERIAL NOT NULL,
    "HocVienID" INTEGER NOT NULL,
    "LopHocID" INTEGER NOT NULL,
    "NgayGhiDanh" TIMESTAMP(3) NOT NULL,
    "GhiChu" TEXT,
    "TrangThai" "TrangThai_GD" NOT NULL DEFAULT 'ACTIVE',
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GhiDanh_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "HoaDon" (
    "ID" SERIAL NOT NULL,
    "MaHoaDon" TEXT NOT NULL,
    "GhiDanhID" INTEGER NOT NULL,
    "TongTien" DECIMAL(10,2) NOT NULL,
    "DaTra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ThoiHan" TIMESTAMP(3) NOT NULL,
    "GhiChu" TEXT,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "HoaDon_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "PhieuThu" (
    "ID" SERIAL NOT NULL,
    "MaPhieuThu" TEXT NOT NULL,
    "HoaDonID" INTEGER NOT NULL,
    "SoTien" DECIMAL(10,2) NOT NULL,
    "NgayThu" TIMESTAMP(3) NOT NULL,
    "GhiChu" TEXT,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PhieuThu_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "User_DienThoai_key" ON "User"("DienThoai");

-- CreateIndex
CREATE UNIQUE INDEX "GiaoVien_MaGiaoVien_key" ON "GiaoVien"("MaGiaoVien");

-- CreateIndex
CREATE UNIQUE INDEX "GiaoVien_UserID_key" ON "GiaoVien"("UserID");

-- CreateIndex
CREATE UNIQUE INDEX "HocVien_MaHocVien_key" ON "HocVien"("MaHocVien");

-- CreateIndex
CREATE UNIQUE INDEX "KhoaHoc_MaKhoaHoc_key" ON "KhoaHoc"("MaKhoaHoc");

-- CreateIndex
CREATE UNIQUE INDEX "LopHoc_MaLopHoc_key" ON "LopHoc"("MaLopHoc");

-- CreateIndex
CREATE UNIQUE INDEX "BuoiHoc_LopHocID_BatDauLuc_key" ON "BuoiHoc"("LopHocID", "BatDauLuc");

-- CreateIndex
CREATE UNIQUE INDEX "KetQua_BuoiHoc_BuoiHocID_key" ON "KetQua_BuoiHoc"("BuoiHocID");

-- CreateIndex
CREATE UNIQUE INDEX "KetQua_ChiTiet_KetQuaID_GhiDanhID_key" ON "KetQua_ChiTiet"("KetQuaID", "GhiDanhID");

-- CreateIndex
CREATE UNIQUE INDEX "GhiDanh_HocVienID_LopHocID_key" ON "GhiDanh"("HocVienID", "LopHocID");

-- CreateIndex
CREATE UNIQUE INDEX "HoaDon_MaHoaDon_key" ON "HoaDon"("MaHoaDon");

-- CreateIndex
CREATE UNIQUE INDEX "HoaDon_GhiDanhID_key" ON "HoaDon"("GhiDanhID");

-- CreateIndex
CREATE UNIQUE INDEX "PhieuThu_MaPhieuThu_key" ON "PhieuThu"("MaPhieuThu");

-- AddForeignKey
ALTER TABLE "GiaoVien" ADD CONSTRAINT "GiaoVien_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HocVien" ADD CONSTRAINT "HocVien_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_KhoaHocID_fkey" FOREIGN KEY ("KhoaHocID") REFERENCES "KhoaHoc"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_GiaoVienID_fkey" FOREIGN KEY ("GiaoVienID") REFERENCES "GiaoVien"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuoiHoc" ADD CONSTRAINT "BuoiHoc_LopHocID_fkey" FOREIGN KEY ("LopHocID") REFERENCES "LopHoc"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQua_BuoiHoc" ADD CONSTRAINT "KetQua_BuoiHoc_BuoiHocID_fkey" FOREIGN KEY ("BuoiHocID") REFERENCES "BuoiHoc"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQua_BuoiHoc" ADD CONSTRAINT "KetQua_BuoiHoc_GiaoVienID_fkey" FOREIGN KEY ("GiaoVienID") REFERENCES "GiaoVien"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQua_ChiTiet" ADD CONSTRAINT "KetQua_ChiTiet_KetQuaID_fkey" FOREIGN KEY ("KetQuaID") REFERENCES "KetQua_BuoiHoc"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KetQua_ChiTiet" ADD CONSTRAINT "KetQua_ChiTiet_GhiDanhID_fkey" FOREIGN KEY ("GhiDanhID") REFERENCES "GhiDanh"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhiDanh" ADD CONSTRAINT "GhiDanh_HocVienID_fkey" FOREIGN KEY ("HocVienID") REFERENCES "HocVien"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhiDanh" ADD CONSTRAINT "GhiDanh_LopHocID_fkey" FOREIGN KEY ("LopHocID") REFERENCES "LopHoc"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoaDon" ADD CONSTRAINT "HoaDon_GhiDanhID_fkey" FOREIGN KEY ("GhiDanhID") REFERENCES "GhiDanh"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhieuThu" ADD CONSTRAINT "PhieuThu_HoaDonID_fkey" FOREIGN KEY ("HoaDonID") REFERENCES "HoaDon"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
