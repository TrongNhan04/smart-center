import { Prisma } from "src/generated/prisma/client";

export const classInclude = {
    khoahoc: { select: { TenKhoaHoc: true, TongSoBuoi: true, HocPhi: true } },
    _count: {
        select: {
            ghidanh: { where: { TrangThai: 'ACTIVE' } },
            buoihoc: { where: { TrangThai: 'COMPLETED' } }
        }
    }
} satisfies Prisma.LopHocInclude

export const classIncludeTeacher = {
    ...classInclude,
    giaovien: { select: { User: { select: { HoTen: true } } } },
} satisfies Prisma.LopHocInclude
