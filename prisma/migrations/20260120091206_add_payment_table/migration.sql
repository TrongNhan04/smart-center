-- AlterTable
ALTER TABLE "BuoiHoc" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GhiDanh" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "GiaoVien" ALTER COLUMN "CreatedAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "HoaDon" ADD COLUMN     "TrangThai" TEXT,
ALTER COLUMN "CreatedAt" SET DEFAULT now();

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
CREATE TABLE "PhieuChi" (
    "ID" SERIAL NOT NULL,
    "HoaDonID" INTEGER,
    "SoTien" DECIMAL(65,30) NOT NULL,
    "LyDo" TEXT NOT NULL,
    "NguoiLapID" INTEGER NOT NULL,
    "NgayChi" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PhieuChi_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhieuChi_HoaDonID_key" ON "PhieuChi"("HoaDonID");

-- AddForeignKey
ALTER TABLE "PhieuChi" ADD CONSTRAINT "PhieuChi_HoaDonID_fkey" FOREIGN KEY ("HoaDonID") REFERENCES "HoaDon"("ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhieuChi" ADD CONSTRAINT "PhieuChi_NguoiLapID_fkey" FOREIGN KEY ("NguoiLapID") REFERENCES "User"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
