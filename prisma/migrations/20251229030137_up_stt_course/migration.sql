/*
  Warnings:

  - The values [AcTIVE] on the enum `TrangThaiKH` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrangThaiKH_new" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
ALTER TABLE "public"."KhoaHoc" ALTER COLUMN "TrangThai" DROP DEFAULT;
ALTER TABLE "KhoaHoc" ALTER COLUMN "TrangThai" TYPE "TrangThaiKH_new" USING ("TrangThai"::text::"TrangThaiKH_new");
ALTER TYPE "TrangThaiKH" RENAME TO "TrangThaiKH_old";
ALTER TYPE "TrangThaiKH_new" RENAME TO "TrangThaiKH";
DROP TYPE "public"."TrangThaiKH_old";
ALTER TABLE "KhoaHoc" ALTER COLUMN "TrangThai" SET DEFAULT 'DRAFT';
COMMIT;
