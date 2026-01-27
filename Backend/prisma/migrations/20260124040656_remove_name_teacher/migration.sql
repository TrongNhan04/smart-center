/*
  Warnings:

  - You are about to drop the column `HoTen` on the `GiaoVien` table. All the data in the column will be lost.
  - You are about to drop the column `TenPhuHuynh` on the `HocVien` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BuoiHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GhiDanh" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GiaoVien" DROP COLUMN "HoTen",
ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "HoaDon" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "HocVien" DROP COLUMN "TenPhuHuynh",
ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KetQua_BuoiHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KetQua_ChiTiet" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "KhoaHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "LopHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "PhieuThu" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "CreatedAt" SET DEFAULT now();
