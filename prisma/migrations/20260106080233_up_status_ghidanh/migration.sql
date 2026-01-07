/*
  Warnings:

  - The values [PENDING,STOPPED] on the enum `TrangThai_GD` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TrangThai_GD_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."GhiDanh" ALTER COLUMN "TrangThai" DROP DEFAULT;
ALTER TABLE "GhiDanh" ALTER COLUMN "TrangThai" TYPE "TrangThai_GD_new" USING ("TrangThai"::text::"TrangThai_GD_new");
ALTER TYPE "TrangThai_GD" RENAME TO "TrangThai_GD_old";
ALTER TYPE "TrangThai_GD_new" RENAME TO "TrangThai_GD";
DROP TYPE "public"."TrangThai_GD_old";
ALTER TABLE "GhiDanh" ALTER COLUMN "TrangThai" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "GhiDanh" ALTER COLUMN "TrangThai" SET DEFAULT 'ACTIVE';
