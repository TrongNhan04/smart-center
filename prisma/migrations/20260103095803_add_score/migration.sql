/*
  Warnings:

  - Added the required column `Diem` to the `KetQua_ChiTiet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KetQua_ChiTiet" ADD COLUMN     "Diem" DECIMAL(4,2) NOT NULL;
