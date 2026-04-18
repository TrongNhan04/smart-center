import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DateHelper } from "src/common/date.helper";
import { PrismaService } from "src/prisma/prisma.service";
import { Pagination } from "../session/session.dto";
import { startOfMonth } from "date-fns";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class AppParentService {
  constructor(
    private prisma: PrismaService
  ) { }

  // Tab trang chủ: buổi học sắp tới, kết quả gần nhất,
  //  nhắc đóng học phí chưa thanh toán của HỌC VIÊN
  async GetDashboard(userId: number, studentId: number) {
    const studentDB = await this.StudentValidator(userId, studentId)
    const [nextSS, lastestResult, invoice] = await Promise.all([
      // buổi học sắp tới 
      this.prisma.buoiHoc.findFirst({
        where: {
          BatDauLuc: { gte: new Date() },
          TrangThai: 'SCHEDULED',
          lophoc: {
            ghidanh: { some: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' } }
          }
        },
        orderBy: { BatDauLuc: 'asc' },
        include: {
          lophoc: {
            select: {
              TenLop: true,
              giaovien: { select: { User: { select: { HoTen: true } } } }
            }
          },
        }
      }),
      //kết quả gần nhất của nhiều lớp
      this.prisma.ghiDanh.findMany({ // tìm nhiều ghi danh của học viên
        where: { HocVienID: studentDB.ID },
        include: {
          lophoc: {
            select: { TenLop: true, khoahoc: { select: { TongSoBuoi: true } } }
          },
          ketqua_chitiet: { // 1 ghi danh có nhiều kết quả chi tiết
            // lấy 1 kết quả mới nhất của ghi danh 
            include: { ketqua_buoihoc: { include: { buoihoc: true } } },
            orderBy: { UpdatedAt: 'desc' },
            take: 1
          }
        },
      }),
      //lấy tất cả hóa đơn ACTIVE của học viên
      this.prisma.hoaDon.findMany({
        where: { ghidanh: { HocVienID: studentDB.ID }, TrangThai: 'ACTIVE' },
        orderBy: { ThoiHan: 'asc' } // lấy gần nhất
      })
    ])
    let BuoiHocKe: {} | null = null
    if (nextSS)
      BuoiHocKe = {
        ID: nextSS.ID, BuoiSo: nextSS.BuoiSo,
        ChuDe: nextSS.ChuDe,
        NgayHoc: nextSS.BatDauLuc,
        GioHoc: DateHelper.ISOToHHMM(nextSS.BatDauLuc, nextSS.KetThucLuc),
        Lop: nextSS.lophoc.TenLop,
        GiaoVien: nextSS.lophoc.giaovien.User.HoTen
      }
    const KetQuaGanNhat = lastestResult.map(item => {
      const { ketqua_chitiet: kq_ct, lophoc, ...restItem } = item
      if (kq_ct.length) { // có kết quả chi tiết
        const { ketqua_buoihoc: kq_bh, ...restKq_ct } = kq_ct[0]
        const { buoihoc } = kq_bh
        return {
          LopHocID: restItem.LopHocID,
          LopHoc: lophoc.TenLop,
          BuoiHocID: kq_bh.BuoiHocID,
          BuoiSo: buoihoc.BuoiSo,
          TongSoBuoi: lophoc.khoahoc.TongSoBuoi,
          NgayHoc: buoihoc.BatDauLuc,
          ChuDe: buoihoc.ChuDe,
          NhanXetCon: restKq_ct.NhanXetRieng ?? kq_bh.NhanXetChung,
          DiemDanh: restKq_ct.DiemDanh,
          Diem: restKq_ct.Diem,
        }
      }
    }).filter(Boolean)
    // return KetQuaGanNhat
    // lọc hóa đơn còn nợ
    const invoiceDebt = invoice.filter(f => f.DaTra < f.TongTien)
    return {
      ID: studentDB.ID.toString(),
      HocVien: studentDB.TenHocVien,
      BuoiHocKe,
      KetQuaGanNhat, // nhiểu kết quả theo lớp học
      HoaDon: {
        SoHDChuaTra: invoiceDebt.length,
        ThoiHan: invoiceDebt.length > 0 ? invoiceDebt[0].ThoiHan : null
      }
    }
  }

  // lấy danh sách lớp học của con
  async GetClassesByStuId(userId: number, studentId: number) {
    const studentDB = await this.StudentValidator(userId, studentId)
    const [classDB, result] = await Promise.all([
      this.prisma.lopHoc.findMany({
        where: { // lớp học viên học
          ghidanh: {
            some: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' }
          }
        },
        include: {
          khoahoc: { select: { TongSoBuoi: true } },
          giaovien: { select: { User: { select: { HoTen: true } } } },
          // lấy buổi học được cập nhật gần nhất
          buoihoc: { select: { ID: true }, orderBy: [{ UpdatedAt: 'desc' }, { ID: 'desc' }] },
          _count: { select: { buoihoc: { where: { TrangThai: 'COMPLETED' } } } }
        }
      }), // kết quả của học viên
      this.prisma.ketQua_ChiTiet.findMany({
        where: { ghidanh: { HocVienID: studentDB.ID } },
        select: {
          ID: true, DiemDanh: true,
          ghidanh: { select: { LopHocID: true } }
        }
      }),
    ])
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
    // return classDB
    const reduceResult = result.reduce((store: any, item) => {
      const classId = item.ghidanh.LopHocID // lấy id lớp
      // console.log(classId)
      if (!store[classId]) // nếu chưa có store của id lớp đó thì tạo mới
        store[classId] = {
          LopHocID: classId,
          CoMat: 0,
          Vang: 0
        }

      if (item.DiemDanh) store[classId].CoMat++
      else store[classId].Vang++
      return store
    }, {}) // để [] thì có sẽ có nhiều phần tử null

    // chuyển từ obj -> arr
    const lastResult = Object.values(reduceResult)
    const newMapLastResult = new Map
      (lastResult.map((item: any) => [item.LopHocID, item]))

    const formatData = (item: any) => ({
      ID: item.ID, MaLop: item.MaLopHoc,
      TenLop: item.TenLop, GiaoVien: item.giaovien.User.HoTen,
      LichHoc: item.LichHoc,
      GioHoc: item.GioBatDau + ' - ' + item?.GioKetThuc,
      BuoiHocDuocChon: item.buoihoc.length ? item.buoihoc[0].ID : null, // null là chưa có buổi học nào
      SoBuoiDaHoc: item._count.buoihoc,
      TongSoBuoi: item.khoahoc.TongSoBuoi,
      CoMat: 0, Vang: 0
    })
    return classDB.map(item => {
      const resultOfClass = newMapLastResult.get(item.ID)
      const getFormatedData = formatData(item)
      if (resultOfClass)
        return {
          ...getFormatedData,
          CoMat: resultOfClass.CoMat,
          Vang: resultOfClass.Vang
        }
      return getFormatedData
    })
  }

  // lấy chi tiết kết quả 1 buổi học của học viên
  async GetSessionDetail(userId: number, studentId: number, sessionId: number) {
    const studentDB = await this.StudentValidator(userId, studentId)
    const [result, sessionDB] = await Promise.all([
      this.prisma.ketQua_ChiTiet.findFirst({ // kết quả
        where: {
          ketqua_buoihoc: { BuoiHocID: sessionId },
          ghidanh: { HocVienID: studentDB.ID }
        },
        include: {
          ketqua_buoihoc: {
            include: {
              tep_dinhkem: {
                select: { URL: true, LoaiTep: true, ID: true }
              },
            }
          }
        }
      }),
      this.prisma.buoiHoc.findUnique({ // buổi học
        where: { ID: sessionId },
        include: {
          lophoc: {
            select: {
              TenLop: true,
              giaovien: { select: { User: { select: { HoTen: true } } } }
            }
          }
        }
      })
    ])
    if (!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
    let TrangThai = 'Đang diễn ra'
    const { BatDauLuc: start, KetThucLuc: end } = sessionDB
    const now = new Date()
    if (sessionDB.TrangThai === 'CANCELLED') TrangThai = 'Đã hủy'
    else if (now < start) TrangThai = 'Sắp tới'
    else if (now > end) TrangThai = 'Đã kết thúc'

    return {
      TenLop: sessionDB.lophoc.TenLop,
      GiaoVien: sessionDB.lophoc.giaovien.User.HoTen,
      HocVien: studentDB.TenHocVien,
      BuoiHocID: sessionDB.ID,
      BuoiSo: sessionDB.BuoiSo,
      NgayHoc: DateHelper.ISOTimeToDate(sessionDB.BatDauLuc),
      GioHoc: DateHelper.ISOToHHMM(sessionDB.BatDauLuc, sessionDB.KetThucLuc),
      DiemDanh: result?.DiemDanh ?? null,
      DiemSo: result?.Diem ?? null,
      BaiHoc: sessionDB.ChuDe ?? null,
      NoiDung: result?.ketqua_buoihoc.NoiDungBaiHoc ?? null,
      BaiTap: result?.ketqua_buoihoc.BaiTapVeNha ?? null,
      NhanXet: result?.NhanXetRieng || result?.ketqua_buoihoc.NhanXetChung,
      TepDinhKem: result?.ketqua_buoihoc.tep_dinhkem,
      TrangThai
    }
  }

  // lấy danh sách id buổi học của lớp
  async GetSessionIdsByClassId(classId: number) {
    const sessionIds = await this.prisma.buoiHoc.findMany({
      where: { LopHocID: classId },
      select: { ID: true, BuoiSo: true },
      orderBy: { ID: 'asc' }
    })
    if (!sessionIds.length) return []
    return sessionIds
  }

  // lấy danh sách hóa đơn của học viên
  async GetInvoiceByStudentID(userId: number, studentId: number) {
    const studentDB = await this.StudentValidator(userId, studentId)
    const invoiceDB = await this.prisma.hoaDon.findMany({
      where: { HocVienID: studentDB.ID, TrangThai: 'ACTIVE' },
      include: {
        hocvien: { select: { TenHocVien: true } },
        ghidanh: { select: { lophoc: { select: { TenLop: true } } } }
      },
      omit: { CreatedAt: true, UpdatedAt: true, GhiDanhID: true },
      orderBy:{ThoiHan:'asc'}
    })
    return invoiceDB.map(item => {
      const { hocvien, ghidanh, ...rest } = item
      return {
        ...rest,
        HocVien: hocvien.TenHocVien,
        LopHoc: ghidanh?.lophoc.TenLop
      }
    })
  }

  // check con ai người nấy xem
  private async StudentValidator(userId: number, studentId: number) {
    const studentDB = await this.prisma.hocVien.findUnique({
      where: { ID: studentId, UserID: userId }
    })
    if (!studentDB) throw new NotFoundException('Student not found')
    return studentDB
  }
}