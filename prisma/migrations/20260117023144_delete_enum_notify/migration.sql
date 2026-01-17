/*
  Warnings:

  - Changed the type of `Loai` on the `ThongBao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

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
ALTER TABLE "PhieuThu" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ThongBao" DROP COLUMN "Loai",
ADD COLUMN     "Loai" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- DropEnum
DROP TYPE "LoaiTB";
