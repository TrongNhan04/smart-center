/*
  Warnings:

  - Added the required column `UpdatedAt` to the `PhieuChi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UpdatedAt` to the `ThongBao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BuoiHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GhiDanh" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GiaoVien" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "HoaDon" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "HocVien" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KetQua_BuoiHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KetQua_ChiTiet" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KhoaHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "LopHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "PhieuChi" ADD COLUMN     "CreatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PhieuThu" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ThongBao" ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- CreateIndex
CREATE INDEX "BuoiHoc_LopHocID_idx" ON "BuoiHoc"("LopHocID");

-- CreateIndex
CREATE INDEX "BuoiHoc_BatDauLuc_idx" ON "BuoiHoc"("BatDauLuc");

-- CreateIndex
CREATE INDEX "BuoiHoc_PhongHoc_BatDauLuc_idx" ON "BuoiHoc"("PhongHoc", "BatDauLuc");

-- CreateIndex
CREATE INDEX "GhiDanh_HocVienID_idx" ON "GhiDanh"("HocVienID");

-- CreateIndex
CREATE INDEX "GhiDanh_LopHocID_TrangThai_idx" ON "GhiDanh"("LopHocID", "TrangThai");

-- CreateIndex
CREATE INDEX "HoaDon_ThoiHan_idx" ON "HoaDon"("ThoiHan");

-- CreateIndex
CREATE INDEX "HocVien_TenHocVien_idx" ON "HocVien"("TenHocVien");

-- CreateIndex
CREATE INDEX "PhieuChi_NgayChi_idx" ON "PhieuChi"("NgayChi");

-- CreateIndex
CREATE INDEX "PhieuThu_NgayThu_idx" ON "PhieuThu"("NgayThu");
