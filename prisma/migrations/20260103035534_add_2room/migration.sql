/*
  Warnings:

  - The values [CANCELED] on the enum `TrangThaiBH` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrangThaiBH_new" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."BuoiHoc" ALTER COLUMN "TrangThai" DROP DEFAULT;
ALTER TABLE "BuoiHoc" ALTER COLUMN "TrangThai" TYPE "TrangThaiBH_new" USING ("TrangThai"::text::"TrangThaiBH_new");
ALTER TYPE "TrangThaiBH" RENAME TO "TrangThaiBH_old";
ALTER TYPE "TrangThaiBH_new" RENAME TO "TrangThaiBH";
DROP TYPE "public"."TrangThaiBH_old";
ALTER TABLE "BuoiHoc" ALTER COLUMN "TrangThai" SET DEFAULT 'SCHEDULED';
COMMIT;

-- AlterTable
ALTER TABLE "BuoiHoc" ADD COLUMN     "PhongHoc" TEXT;

-- AlterTable
ALTER TABLE "LopHoc" ADD COLUMN     "PhongHoc" TEXT;
