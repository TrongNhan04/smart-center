-- CreateEnum
CREATE TYPE "LoaiTB" AS ENUM ('SESSION_RESULT', 'INVOICE', 'SYSTEM', 'SCHEDULE_CHANGE');

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
ALTER TABLE "User" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- CreateTable
CREATE TABLE "ThongBao" (
    "ID" SERIAL NOT NULL,
    "UserId" INTEGER NOT NULL,
    "TieuDe" TEXT NOT NULL,
    "NoiDung" TEXT NOT NULL,
    "Loai" "LoaiTB" NOT NULL,
    "DuLieu" JSONB NOT NULL,
    "DaDoc" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMPTZ(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ThongBao_UserId_key" ON "ThongBao"("UserId");

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
