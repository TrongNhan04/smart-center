/*
  Warnings:

  - You are about to drop the column `UserId` on the `ThongBao` table. All the data in the column will be lost.
  - Added the required column `UserID` to the `PhieuThu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UserID` to the `ThongBao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ThongBao" DROP CONSTRAINT "ThongBao_UserId_fkey";

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
ALTER TABLE "PhieuThu" ADD COLUMN     "UserID" INTEGER NOT NULL,
ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "ThongBao" DROP COLUMN "UserId",
ADD COLUMN     "UserID" INTEGER NOT NULL,
ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AddForeignKey
ALTER TABLE "PhieuThu" ADD CONSTRAINT "PhieuThu_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
