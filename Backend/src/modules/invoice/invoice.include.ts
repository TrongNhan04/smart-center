import { Prisma } from "src/generated/prisma/client";

export const InvoiceIncludeStu_Eroll = {
    hocvien: {
        select: {
            TenHocVien: true,
            Parent: { select: { DienThoai: true } }
        }
    },
    ghidanh: { select: { lophoc: { select: { TenLop: true } } } }
} satisfies Prisma.HoaDonInclude