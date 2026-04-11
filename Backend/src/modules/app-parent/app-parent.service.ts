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
        select: {
          ID: true, PhongHoc: true, BuoiSo: true, ChuDe: true,
          BatDauLuc: true, KetThucLuc: true,
          lophoc: {
            select: {
              TenLop: true,
              giaovien: { select: { User: { select: { HoTen: true } } } }
            }
          },
        }
      }),
      // kết quả gần nhất của nhiều lớp
      this.prisma.ghiDanh.findMany({
        where: { HocVienID: studentDB.ID },
        include: {
          lophoc: {
            select: { TenLop: true, khoahoc: { select: { TongSoBuoi: true } } }
          },
          ketqua_chitiet: { // kết quả mới nhất của lớp đó
            include: { ketqua_buoihoc: { include: { buoihoc: true } } },
            orderBy: { UpdatedAt: 'desc' },
            take: 1
          }
        },
      }),
      //lấy số hóa đơn chưa thanh toán
      this.prisma.hoaDon.findMany({
        where: { ghidanh: { HocVienID: studentDB.ID } },
        orderBy: { ThoiHan: 'asc' } // lấy gần nhất
      })
    ])
    let BuoiHocKe: {} | null = null
    let KetQuaGanNhat: any[] = []
    if (nextSS)
      BuoiHocKe = {
        ID: nextSS.ID, BuoiSo: nextSS.BuoiSo,
        ChuDe: nextSS.ChuDe,
        NgayHoc: nextSS.BatDauLuc,
        GioHoc: DateHelper.ISOToHHMM(nextSS.BatDauLuc, nextSS.KetThucLuc),
        Lop: nextSS.lophoc.TenLop,
        GiaoVien: nextSS.lophoc.giaovien.User.HoTen
      }

    for (const item of lastestResult) {
      if (item.ketqua_chitiet.length) {
        KetQuaGanNhat.push({
          LopHocID: item.LopHocID,
          LopHoc: item.lophoc.TenLop,
          BuoiHocID: item.ketqua_chitiet[0].ketqua_buoihoc.BuoiHocID,
          BuoiSo: item.ketqua_chitiet[0]?.ketqua_buoihoc.buoihoc.BuoiSo,
          TongSoBuoi: item.lophoc.khoahoc.TongSoBuoi,
          NgayHoc: item.ketqua_chitiet[0]?.ketqua_buoihoc.buoihoc.BatDauLuc,
          ChuDe: item.ketqua_chitiet[0]?.ketqua_buoihoc.buoihoc.ChuDe,
          NhanXetCon: item.ketqua_chitiet[0]?.NhanXetRieng ??
            item.ketqua_chitiet[0].ketqua_buoihoc.NhanXetChung,
          DiemDanh: item.ketqua_chitiet[0]?.DiemDanh,
          Diem: item.ketqua_chitiet[0]?.Diem,
        })
      }
    }
    const invoiceFilter = invoice.filter(f => f.DaTra < f.TongTien)
    return {
      ID: studentDB.ID.toString(),
      HocVien: studentDB.TenHocVien,
      BuoiHocKe,
      KetQuaGanNhat,
      HoaDon: {
        SoHDChuaTra: invoiceFilter.length,
        ThoiHan: invoiceFilter.length > 0 ? invoiceFilter[0].ThoiHan : null
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
          _count: { select: { buoihoc: { where: { TrangThai: 'COMPLETED' } } } }
        }
      }), // kết quả của học viên
      this.prisma.ketQua_ChiTiet.findMany({
        where: { ghidanh: { HocVienID: studentDB.ID } },
        select: {
          ID: true, DiemDanh: true,
          ghidanh: { select: { LopHocID: true } }
        }
      })
    ])
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
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

    const formatData = (item:any) => ({
      ID: item.ID, MaLop: item.MaLopHoc,
      TenLop: item.TenLop, GiaoVien: item.giaovien.User.HoTen,
      LichHoc: item.LichHoc,
      GioHoc: item.GioBatDau + ' - ' + item?.GioKetThuc,
      SoBuoiDaHoc: item._count.buoihoc,
      TongSoBuoi: item.khoahoc.TongSoBuoi,
      CoMat: 0,  Vang: 0
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

  // tab buổi học phần trên: đtb, %tham gia, biểu đồ
  async GetResultSumary(userId: number, studentId: number) {
    // tính điểm trung bình tháng -> avg._avg.Diem
    // tính tổng số buổi học đã diễn ra -> result.length
    // tính tổng số buổi học học viên tham gia -> avg._count.ID
    // lấy dữ liệu 5 buổi học tham gần nhất vẽ điểm  -> results
    const { start } = DateHelper.GetStartEndOfMonth(new Date())
    await this.StudentValidator(userId, studentId)

    const baseWhere: Prisma.KetQua_ChiTietWhereInput = {
      ketqua_buoihoc: {
        buoihoc: {
          TrangThai: { not: 'CANCELLED' },
          BatDauLuc: { gte: start },
          KetThucLuc: { lte: new Date() }
        }
      },
      ghidanh: { HocVienID: studentId }
    }
    const [avg, results] = await Promise.all([
      // tính trung bình tháng + tổng buổi đi học
      this.prisma.ketQua_ChiTiet.aggregate({
        _count: { ID: true },
        _avg: { Diem: true },
        where: {
          ...baseWhere,
          DiemDanh: true
        }
      })
      // các buổi đã diễn ra 
      , this.prisma.ketQua_ChiTiet.findMany({
        where: { ...baseWhere },
        orderBy: { ketqua_buoihoc: { buoihoc: { BatDauLuc: 'asc' } } },
        include: { ketqua_buoihoc: { include: { buoihoc: true } } },
      })
    ])
    return {
      average_score: Number(avg._avg.Diem),
      attendance: {
        total: results.length,
        attend: avg._count.ID,
        percent: (avg._count.ID / results.length) * 100
      },
      chart_data: results.map(m => ({
        date: m.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
        grade: m.Diem ? Number(m.Diem) : m.Diem
      }))
    }
  }

  // Tab buổi học phần dưới: các buổi đã học (phân trang) 
  async GetSessionResults(userId: number, studentId: number, p: Pagination) {
    await this.StudentValidator(userId, studentId)
    const take = Number(p.limit)
    const skip = Number(p.page - 1) * Number(p.limit)
    const results = await this.prisma.ketQua_ChiTiet.findMany({
      where: {
        ketqua_buoihoc: {
          buoihoc: {
            TrangThai: { not: 'CANCELLED' },
            KetThucLuc: { lte: new Date() }
          }
        },
        ghidanh: { HocVienID: studentId }
      },
      select: {
        Diem: true,
        ketqua_buoihoc: {
          select: {
            buoihoc: {
              select: {
                BatDauLuc: true, ChuDe: true,
                lophoc: { select: { TenLop: true } }
              }
            }
          }
        }
      },
      take: take, skip: skip
    })
    return {  //lịch sử buổi học gồm ngày, lớp, chủ đề, điểm
      session_results: results.map(m => ({
        date: m.ketqua_buoihoc.buoihoc.BatDauLuc.toLocaleDateString(),
        class: m.ketqua_buoihoc.buoihoc.lophoc.TenLop,
        topic: m.ketqua_buoihoc.buoihoc.ChuDe,
        grade: m.Diem
      }))
    }
  }

  // phần dưới: chi tiết các buổi học 
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
            include: { tep_dinhkem: { select: { URL: true } }, }
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

    return {
      TenLop: sessionDB.lophoc.TenLop,
      GiaoVien: sessionDB.lophoc.giaovien.User.HoTen,
      BuoiHocID: sessionDB.ID,
      NgayHoc: sessionDB.BatDauLuc,
      GioHoc: DateHelper.ISOToHHMM(sessionDB.BatDauLuc, sessionDB.KetThucLuc),
      DiemDanh: result?.DiemDanh,
      DiemSo: result?.Diem,
      BaiHoc: sessionDB.ChuDe,
      NoiDung: result?.ketqua_buoihoc.NoiDungBaiHoc,
      BaiTap: result?.ketqua_buoihoc.BaiTapVeNha,
      NhanXet: result?.NhanXetRieng || result?.ketqua_buoihoc.NhanXetChung,
      TepDinhKem: result?.ketqua_buoihoc.tep_dinhkem
    }
  }

  // lấy danh sách hóa đơn của học viên
  async GetInvoiceByStudentID(userId: number, studentId: number) {
    await this.StudentValidator(userId, studentId)
    const inv = await this.prisma.hoaDon.findMany({
      where: { ghidanh: { HocVienID: studentId } }
    })
    return inv.map(m => ({
      id: m.ID,
      code: m.MaHoaDon,
      total: Number(m.TongTien),
      paid: Number(m.DaTra),
      debt: m.TrangThai ? 0 : Number(m.TongTien) - Number(m.DaTra),
      status: m.TrangThai,
      term: m.ThoiHan,
      note: m.GhiChu
    }))
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