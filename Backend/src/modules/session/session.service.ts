import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDTO } from "./session.dto";
import { DateHelper } from "src/common/date.helper";
import { SessionResultService } from "../session-result/session-result.service";
import { SessionsResultDTO } from "../session-result/session-result.dto";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private resultService: SessionResultService,
    private notisService: NotifyService
  ) { }

  // lấy danh sách buổi học theo lớp
  async getManyByClassId(classId: number, userId: number | null) {
    const where: Prisma.BuoiHocWhereInput = { LopHocID: classId }
    if (userId) {
      const classDB = await this.prisma.lopHoc.findFirst({
        where: { ID: classId, giaovien: { UserID: userId } }
      })
      if (!classDB) throw new ForbiddenException
        ('Không tìm thấy lớp học hoặc truy cập bị từ chối')
      where.lophoc = { giaovien: { UserID: userId } }
    }

    const sessions = await this.prisma.buoiHoc.findMany({
      where,
      omit: { CreatedAt: true, UpdatedAt: true },
      orderBy: { BatDauLuc: 'asc' }
    })
    return sessions.map(item => {
      let status = ''
      const isOverTime = DateHelper.TimeDiff(item.KetThucLuc) > 2880
      if (isOverTime && item.TrangThai === 'SCHEDULED') {
        status = 'UNSUBMIT'// qua 48h vẫn SCHEDULED => chưa nộp kết quả
        return { ...item, TrangThai: status }
      }
      return item
    })
  }

  // hủy buổi học kèm lý do
  async cancelById(sessionId: number, reason: string) {
    const sessionDB = await this.sessionIdValidator(sessionId)
    if (sessionDB.TrangThai !== 'SCHEDULED')
      throw new ConflictException('Buổi học đã hoàn thành hoặc đã hủy')
    if (!reason) throw new BadRequestException('Thiếu lý do hủy buổi học')

    const data = await this.prisma.$transaction(async (tx) => {
      return await tx.buoiHoc.update({
        where: { ID: sessionDB.ID, TrangThai: 'SCHEDULED' },
        data: { TrangThai: 'CANCELLED' },
        select: {
          BatDauLuc: true, LopHocID: true,
          lophoc: {
            select: {
              TenLop: true,
              ghidanh: {
                where: { TrangThai: 'ACTIVE' },
                select: { hocvien: { select: { UserID: true } } }
              }
            }
          }
        }
      })
    })
    const listParentID = data.lophoc.ghidanh.map(e => e.hocvien.UserID)
    const uniqueId = [...new Set(listParentID)]
    await this.notisService.createCancelSessionNotify(uniqueId, data, reason)
  }

  // tạo buổi học tự động
  async autoGenerate(classId: number) {
    const classDB = await this.prisma.lopHoc.findUnique({
      where: { ID: classId },
      include: {
        khoahoc: {
          select: {
            TongSoBuoi: true, ThoiGian: true,
            decuong: { select: { ThuTu: true, ChuDe: true } }
          }
        }
      }
    })
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học');
    if (classDB.TrangThai === 'CLOSED')
      throw new ConflictException('Lớp đã đóng')

    const totalSessions = classDB.khoahoc.TongSoBuoi;
    // số buổi đã có trong danh sách buổi học của lớp
    const currentCount = await this.prisma.buoiHoc.count({
      where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } }
    })

    if (currentCount >= totalSessions) throw new ConflictException(`Đã đủ số buổi học của khóa (${totalSessions})`)
    //số buổi cần sinh 
    const need = totalSessions - currentCount

    // xác định ngày của buổi cuối cùng trong danh sách buổi học
    const lastDate = await this.prisma.buoiHoc.findFirst({
      where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } },
      orderBy: { BatDauLuc: 'desc' },
      select: { BatDauLuc: true }
    })
    // xác định ngày bắt đầu dò để buổi học đúng lịch học
    let xday = lastDate ? lastDate.BatDauLuc : classDB.TuNgay
    if (lastDate) xday.setDate(xday.getDate() + 1)//dò từ ngày tiếp theo buổi cuối

    const endDate = classDB.DenNgay
    if (xday > endDate) throw new ConflictException('Không thể tạo thêm buổi học!')

    // Mảng danh sách buổi học để đưa cho createMany()
    const data: Prisma.BuoiHocCreateManyInput[] = []

    const newMapSyllabus = new Map // tạo 1 map đề cương
      (classDB.khoahoc.decuong.map((item, index) => [index + 1, item]))
    let thuTuDeCuong = currentCount + 1 // lấy thứ tự đề cương = buổi hiện có + 1
    // xday <= end endDate để ngày = end vẫn xét tiếp
    // data.length < need để khi length = need thì dừng
    while (xday <= endDate && data.length < need) {
      const dow = xday.getDay() // 0..6
      if (classDB.LichHoc.includes(dow)) {
        const startAt = DateHelper.combineDateAndTime(xday, classDB.GioBatDau)
        const endAt = DateHelper.combineDateAndTime(xday, classDB.GioKetThuc)

        data.push({
          LopHocID: classId, PhongHoc: classDB.PhongHoc,
          BuoiSo: newMapSyllabus.get(thuTuDeCuong)?.ThuTu || thuTuDeCuong,
          ChuDe: newMapSyllabus.get(thuTuDeCuong)?.ChuDe,
          BatDauLuc: startAt, KetThucLuc: endAt,
        })
        thuTuDeCuong++ // tăng bên trong if của đúng ngày 
      }
      xday.setDate(xday.getDate() + 1);
    }
    if (data.length === 0) throw new BadRequestException
      ('Không có buổi học mới nào phù hợp với lịch học')
    return await this.prisma.buoiHoc.createManyAndReturn({
      data, skipDuplicates: true
    })
  }

  // tạo buổi học thủ công 
  async manualGenerate(classId: number, body: CreateSessionDTO) {
    const classDB = await this.prisma.lopHoc.findUnique({
      where: { ID: classId }
    })
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
    if (classDB.TrangThai === 'CLOSED')
      throw new ConflictException('Lớp đã đóng')

    DateHelper.ValidateTimeRange(body.startAt, body.endAt)
    const last = await this.prisma.buoiHoc.findFirst({
      where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } },
      orderBy: { BatDauLuc: 'desc' },
      select: { BatDauLuc: true },
    });
    const compareDate = last ? last.BatDauLuc : classDB.TuNgay
    if (body.date < compareDate)
      throw new ConflictException(`Buổi học mới phải bắt đầu từ ngày ${compareDate.toLocaleDateString()}`)

    const startAt = DateHelper.combineDateAndTime(body.date, body.startAt)
    const endAt = DateHelper.combineDateAndTime(body.date, body.endAt)

    if (body.room) await this.hasSameRoom(body.room, startAt, endAt,)

    return await this.prisma.$transaction(async (tx) => {
      // kiểm tra trùng buổi hoặc đè buổi trong CÙNG LỚP
      const duplicate = await tx.buoiHoc.findFirst({
        where: {
          LopHocID: classId,
          BatDauLuc: { lt: endAt },//lớn hơn
          KetThucLuc: { gt: startAt },// nhỏ hơn
        },
        select: { BuoiSo: true, lophoc: { select: { TenLop: true } } }
      })
      if (duplicate) throw new ConflictException
        (`Trùng lịch học với buổi số ${duplicate.BuoiSo} của lớp`)
      // BuoiSo = max + 1 
      const max = await tx.buoiHoc.findFirst({
        where: { LopHocID: classId },
        orderBy: { BuoiSo: 'desc' },
        select: { BuoiSo: true }
      })
      const nextSs = (max?.BuoiSo ?? 0) + 1

      return await tx.buoiHoc.create({
        data: {
          BuoiSo: nextSs, LopHocID: classId, ChuDe: body.topic,
          BatDauLuc: startAt, KetThucLuc: endAt, PhongHoc: body.room
        }
      })
    })
  }

  // lấy danh sách buổi học 1 lớp giáo viên A dạy 
  async getManyByUserId(userId: number, classId: number) {
    const teacherDB = await this.getTeacherByUserId(userId)
    const classDB = await this.prisma.lopHoc.findFirst({
      where: { ID: classId, GiaoVienID: teacherDB.ID }
    })
    if (!classDB) throw new NotFoundException
      ('Lớp không tồn tại hoặc truy cập bị từ chối')
    const sessions = await this.prisma.buoiHoc.findMany({
      where: { LopHocID: classId, lophoc: { GiaoVienID: teacherDB.ID } },
      omit: { LopHocID: true, CreatedAt: true, UpdatedAt: true }
    })
    return sessions
  }

  // lấy thông tin 1 buổi học
  async getOne(sessionId: number, userId: number | null) {
    if (userId) { // là giáo viên
      const teacherDB = await this.getTeacherByUserId(userId)
      const canAccess = await this.prisma.buoiHoc.findFirst({
        where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } }
      })
      if (!canAccess)
        throw new ForbiddenException('Không tìm thấy buổi học hoặc truy cập bị từ chối')
    }
    const [sessionDB, result] = await Promise.all([
      this.prisma.buoiHoc.findFirst({
        where: { ID: sessionId },
        include: {
          ketqua_buoihoc: {
            select: {
              NoiDungBaiHoc: true, BaiTapVeNha: true, NhanXetChung: true
            }
          },
          lophoc: {
            select: {
              TenLop: true,
              giaovien: { select: { User: { select: { HoTen: true } } } }
            }
          }
        },
        omit: { CreatedAt: true, UpdatedAt: true }
      }),
      this.resultService.getSSResult(sessionId)
    ])
    if (!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
    const { ketqua_buoihoc, lophoc, ...rest } = sessionDB
    return {
      ...rest,
      LopHoc: lophoc.TenLop,
      ...ketqua_buoihoc,
      GiaoVien: lophoc.giaovien.User.HoTen,
      ChiTietKetQua: result
    }
  }

  // lưu nháp kết quả buổi học - Draft - resultService
  async saveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    return await this.resultService.saveDraftResult(userId, sessionId, body)
  }

  // lưu thật kết quả buổi học - Submit - resultService
  async submittedResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    return await this.resultService.submittedResult(userId, sessionId, body)
  }

  // mở khóa lưu kết quả buổi học - resultService
  async unlockSession(sessionId: number) {
    return await this.resultService.unlockSession(sessionId)
  }

  // gửi yêu cầu mở khóa buổi học - resultService
  async requestUnlock(userId: number, sessionId: number, reason: string) {
    return await this.resultService.RequestUnlock(userId, sessionId, reason)
  }

  // lấy giáo viên từ userId
  private async getTeacherByUserId(userId: number) {
    const teacherDB = await this.prisma.giaoVien.findUnique({
      where: { UserID: userId }
    })
    if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
    if (teacherDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Teacher was INACTIVE')
    return teacherDB
  }

  // kiểm tra id session
  private async sessionIdValidator(sessionId: number) {
    const sessionDB = await this.prisma.buoiHoc.findUnique({
      where: { ID: sessionId }
    })
    if (!sessionDB)
      throw new NotFoundException('Không tìm thấy buổi học')
    return sessionDB
  }

  // kiểm tra trùng phòng
  private async hasSameRoom(room: string, start: Date, end: Date, excludeId?: number) {
    if (!room) return
    const conflict = await this.prisma.buoiHoc.findFirst({
      where: {
        TrangThai: 'SCHEDULED',
        PhongHoc: room,// trùng phòng
        BatDauLuc: { lt: end },// trùng giờ
        KetThucLuc: { gt: start },
        ID: excludeId ? { not: excludeId } : undefined
      }
    })
    if (conflict) throw new BadRequestException(`Phòng ${room} đã được sử dụng trong thời gian này`)
  }
}