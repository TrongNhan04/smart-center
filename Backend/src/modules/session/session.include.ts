import { Prisma } from 'src/generated/prisma/client';

export const SessionIncludeClass = {
  lophoc: {
    select: {
      TenLop: true,
      GiaoVienID: true,
      giaovien: { select: { User: { select: { HoTen: true } } } },
    },
  },
} satisfies Prisma.BuoiHocInclude;

export const SessionSelectCountEnroll = {
  lophoc: {
    select: {
      ID: true,
      TenLop: true,
      PhongHoc: true,
      _count: { select: { ghidanh: { where: { TrangThai: 'ACTIVE' } } } },
    },
  },
} satisfies Prisma.BuoiHocInclude;
