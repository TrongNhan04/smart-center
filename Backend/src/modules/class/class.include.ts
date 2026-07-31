import { Prisma } from 'src/generated/prisma/client';

export const classCountSelect = {
  _count: {
    select: {
      ghidanh: { where: { TrangThai: 'ACTIVE' } },
      buoihoc: { where: { TrangThai: 'COMPLETED' } },
    },
  },
} satisfies Prisma.LopHocInclude;

export const classInclude = {
  khoahoc: { select: { TenKhoaHoc: true, TongSoBuoi: true, HocPhi: true } },
  ...classCountSelect,
} satisfies Prisma.LopHocInclude;

export const classIncludeTeacher = {
  giaovien: { select: { User: { select: { HoTen: true } } } },
  ...classInclude,
} satisfies Prisma.LopHocInclude;
