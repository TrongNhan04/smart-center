import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDTO, SessionStatusDTO, UpdateSessionDTO } from "./session.dto";
import { DateHelper } from "src/common/date.helper";
import { SessionResultService } from "../session-result/session-result.service";
import { SessionsResultDTO } from "../session-result/session-result.dto";
import { NotifyService } from "../notify/notify.service";
import { endOfDay, setDay, startOfDay } from "date-fns";
import { BuoiHocWhereInput } from "src/generated/prisma/models";

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private resultService: SessionResultService,
    private notisService: NotifyService
  ) { }

  // lấy danh sách buổi học theo lớp
  async GetSessionsByClassId(classId: number, userId: number | null) {
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
      let status = '' // qua 12h là chưa nộp kết quả, vẫn cho phép nộp trong 48h
      const isOverTime = DateHelper.TimeDiff(item.KetThucLuc) > 120
      if (isOverTime && item.TrangThai === 'SCHEDULED') {
        status = 'UNSUBMIT'
        return { ...item, TrangThai: status }
      }
      return item
    })
  }

  //sửa buổi học: chủ đề 
  async UpdateSessionById(userId: number | null, sessionId: number, body: UpdateSessionDTO) {
    // const data: Prisma.BuoiHocUpdateInput = {}
    if (!userId) {// admin
      const sessionDB = await this.SessionIdValidator(sessionId)
      if (body.room) await this.HasSameRoom(body.room, sessionDB.BatDauLuc, sessionDB.KetThucLuc, sessionId)
    }
    else {//giáo viên
      const { sessionDB } = await this.SessionAcsessValidate(userId, sessionId)
      if (body.room) await this.HasSameRoom(body.room, sessionDB.BatDauLuc, sessionDB.KetThucLuc, sessionId)
    }

    await this.prisma.buoiHoc.update({
      where: { ID: sessionId },
      data: { ChuDe: body.topic, PhongHoc: body.room },
      select: { BuoiSo: true, ChuDe: true }
    })
  }

  // hủy buổi học kèm lý do
  async CancelSessionById(sessionId: number, reason: string) {
    const sessionDB = await this.SessionIdValidator(sessionId)
    if (sessionDB.TrangThai !== 'SCHEDULED')
      throw new ConflictException('Buổi học đã hoàn thành hoặc đã hủy')
    if (!reason) throw new BadRequestException('Thiếu lý do hủy buổi học')

    const updateSS = await this.prisma.buoiHoc.update({
      where: { ID: sessionId, TrangThai: 'SCHEDULED' },
      data: { TrangThai: 'CANCELLED' },
      select: {
        BatDauLuc: true, LopHocID: true,
        lophoc: {
          select: {
            ID: true, MaLopHoc: true,
            ghidanh: {
              where: { TrangThai: 'ACTIVE' },
              select: { hocvien: { select: { UserID: true } } }
            }
          }
        }
      }
    })
    const listParentID = updateSS.lophoc.ghidanh.map(e => e.hocvien.UserID)
    const uniqueId = [...new Set(listParentID)]
    await this.notisService.SSCancelledNotify(uniqueId, updateSS, reason)
    // return { mgs: "Session cancelled and notify parent successfully" }
  }

  // tạo buổi học tự động
  async AutoGenerateSession(classId: number) {
    const classDB = await this.prisma.lopHoc.findUnique({
      where: { ID: classId },
      select: {// lịch học 0..6 theo getDay(), giờ học "18:03"
        ID: true, TuNgay: true, DenNgay: true,
        LichHoc: true, GioBatDau: true, PhongHoc: true,
        GioKetThuc: true, TrangThai: true,
        khoahoc: { select: { TongSoBuoi: true, ThoiGian: true } }
      }
    })
    if (!classDB) throw new NotFoundException('Không tìm thấy lớp học');

    const totalSessions = classDB.khoahoc.TongSoBuoi;
    const durationMonths = classDB.khoahoc.ThoiGian;

    // số buổi mỗi tháng
    const perChunk = Math.ceil(totalSessions / durationMonths)
    // số buổi đã có trong danh sách buổi học của lớp
    const currentCount = await this.prisma.buoiHoc.count({ where: { LopHocID: classId } })

    if (currentCount >= totalSessions)
      throw new ConflictException(`Đã đủ số buổi học của khóa (${totalSessions})`)
    //số buổi cần sinh = MIN của số buổi mỗi tháng và số buổi còn lại
    const need = Math.min(perChunk, totalSessions - currentCount)

    // xác định ngày của buổi cuối trong danh sách buổi học
    const last = await this.prisma.buoiHoc.findFirst({
      where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } },
      orderBy: { BatDauLuc: 'desc' },
      select: { BatDauLuc: true }
    })
    // xác định ngày bắt đầu dò để buổi học đúng lịch học
    let xday = last ? last.BatDauLuc : classDB.TuNgay //gán giá trị cho xday
    if (last) xday.setDate(xday.getDate() + 1)//dò từ ngày tiếp theo buổi cuối

    const endDate = classDB.DenNgay
    if (xday > endDate) throw new ConflictException('Không thể tạo thêm buổi học!')

    // Mảng danh sách buổi học để đưa cho createMany()
    const data: Prisma.BuoiHocCreateManyInput[] = []
    let buoiSo = currentCount + 1

    while (xday <= endDate && data.length < need) {
      const dow = xday.getDay() // 0..6
      if (classDB.LichHoc.includes(dow)) {
        const startAt = DateHelper.combineDateAndTime(xday, classDB.GioBatDau)
        const endAt = DateHelper.combineDateAndTime(xday, classDB.GioKetThuc)
        // tìm những buổi học của lớp khác có trùng thời gian (1)
        const conflict = await this.prisma.buoiHoc.findFirst({
          where: {
            TrangThai: 'SCHEDULED',
            BatDauLuc: { lt: endAt },
            KetThucLuc: { gt: startAt },
            LopHocID: { not: classDB.ID }
          }
        })
        // từ (1) -> phòng lớp khác khác null và phòng buổi học 
        // giống lớp khác thì conflict
        if (classDB.PhongHoc && conflict?.PhongHoc === classDB.PhongHoc)
          console.log(`bỏ ngày ${xday.toLocaleString()} vì trùng lịch học với buổi học ID: ${conflict.ID}`)
        else {
          data.push({
            LopHocID: classId, BuoiSo: buoiSo++,
            BatDauLuc: startAt, KetThucLuc: endAt, PhongHoc: classDB.PhongHoc
          })
        }
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
  async ManualGenerateSession(classId: number, body: CreateSessionDTO) {
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

    if (body.room) await this.HasSameRoom(body.room, startAt, endAt,)

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
        (`Trùng lịch học với buổi số ${duplicate.BuoiSo} lớp ${duplicate.lophoc.TenLop}`)
      // kiểm tra giáo viên lớp mình có trùng buổi học với LỚP KHÁC
      await this.CheckTeacherFree(classId, body)
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
        },
        omit: { CreatedAt: true, UpdatedAt: true }
      })
    })
  }

  // lấy lịch dạy 1 tuần cho giáo viên
  async GetSessionsOneWeek(userId: number, start: Date, end: Date) {
    const sod = startOfDay(start)
    const eod = startOfDay(setDay(end, 1))
    const teacherDB = await this.GetTeacherByUserId(userId)
    const sessionDB = await this.prisma.buoiHoc.findMany({
      where: {
        lophoc: { GiaoVienID: teacherDB.ID },
        BatDauLuc: { gte: sod },
        KetThucLuc: { lt: eod },
      },
      select: {
        ID: true, BatDauLuc: true, KetThucLuc: true, PhongHoc: true,
        TrangThai: true, LopHocID: true, lophoc: { select: { TenLop: true } }
      },
      orderBy: { BatDauLuc: 'asc' }
    })
    if (sessionDB.length == 0) return []

    return sessionDB.map(item => ({
      ID: item.ID, NgayHoc: item.BatDauLuc.toISOString().substring(0, 10),
      GioHoc: DateHelper.ISOToHHMM(item.BatDauLuc, item.KetThucLuc),
      LopHocID: item.LopHocID, TenLop: item.lophoc.TenLop,
      TrangThai: item.TrangThai, PhongHoc: item.PhongHoc
    }))
  }

  // lấy danh sách buổi học 1 lớp giáo viên A dạy 
  async GetSessionsByUserId(userId: number, classId: number) {
    const teacherDB = await this.GetTeacherByUserId(userId)
    const classDB = await this.prisma.lopHoc.findFirst({
      where: { ID: classId, GiaoVienID: teacherDB.ID }
    })
    if (!classDB) throw new NotFoundException
      ('Lớp không tồn tại hoặc truy cập bị từ chối')
    const sessions = await this.prisma.buoiHoc.findMany({
      where: { LopHocID: classId, lophoc: { GiaoVienID: teacherDB.ID } },
      omit: { ID: true, LopHocID: true, CreatedAt: true, UpdatedAt: true }
    })
    return sessions
  }

  // lấy thông tin buổi học
  async GetSession_Result(sessionId: number, userId: number | null) {
    if (userId) { // là giáo viên
      const teacherDB = await this.GetTeacherByUserId(userId)
      const canAccess = await this.prisma.buoiHoc.findFirst({
        where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } }
      })
      if (!canAccess)
        throw new ForbiddenException('Không tìm thấy buổi học hoặc truy cập bị từ chối')
    }
    const [sessionDB, result] = await Promise.all([
      this.prisma.buoiHoc.findFirst({
        where: { ID: sessionId },
        select: {
          ID: true, BuoiSo: true, ChuDe: true, PhongHoc: true,
          BatDauLuc: true, KetThucLuc: true, TrangThai: true,
          ketqua_buoihoc: true,
          lophoc: {
            select: {
              TenLop: true,
              giaovien: { select: { User: { select: { HoTen: true } } } }
            }
          }
        }
      }),
      this.resultService.GetSSResult(sessionId)
    ])
    if (!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
    return {
      ID: sessionDB.ID, BuoiSo: sessionDB.BuoiSo, ChuDe: sessionDB.ChuDe,
      BatDauLuc: sessionDB.BatDauLuc, KetThucLuc: sessionDB.KetThucLuc,
      PhongHoc: sessionDB.PhongHoc, LopHoc: sessionDB.lophoc.TenLop,
      NhanXetChung: sessionDB.ketqua_buoihoc?.NhanXetChung,
      GiaoVien: sessionDB.lophoc.giaovien.User.HoTen,
      TrangThai: sessionDB.TrangThai,
      ChiTietKetQua: result
    }
  }

  // lưu nháp kết quả buổi học - Draft
  async SaveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    return await this.resultService.SaveDraftResult(userId, sessionId, body)
  }

  // lưu thật kết quả buổi học - Submit
  async SubmittedResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    return await this.resultService.SubmittedResult(userId, sessionId, body)
  }

  // mở khóa lưu kết quả buổi học
  async UnlockSession(sessionId: number) {
    return await this.resultService.UnlockSession(sessionId)
  }

  // gửi yêu cầu mở khóa buổi học
  async RequestUnlock(userId: number, sessionId: number, reason: string) {
    return await this.resultService.RequestUnlock(userId, sessionId, reason)
  }

  // lấy giáo viên từ userId
  private async GetTeacherByUserId(userId: number) {
    const teacherDB = await this.prisma.giaoVien.findUnique({
      where: { UserID: userId }
    })
    if (!teacherDB) throw new NotFoundException('Teacher not found')
    if (teacherDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Teacher was INACTIVE')
    return teacherDB
  }

  // kiểm tra id session
  private async SessionIdValidator(sessionId: number) {
    const sessionDB = await this.prisma.buoiHoc.findUnique({
      where: { ID: sessionId }
    })
    if (!sessionDB)
      throw new NotFoundException('Session is not existed')
    return sessionDB
  }

  // kiểm tra giáo viên có trống buổi đó không
  private async CheckTeacherFree(classId: number, body: CreateSessionDTO) {
    const teacherDB = await this.prisma.lopHoc.findUnique({
      where: { ID: classId },
      select: { GiaoVienID: true, giaovien: { select: { TrangThai: true } } }
    })
    if (!teacherDB) throw new NotFoundException('Teacher not found')
    if (teacherDB.giaovien.TrangThai === 'INACTIVE')
      throw new ConflictException('Teacher was retired')
    const startDay = new Date(body.date)
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date(startDay)
    endDay.setDate(endDay.getDate() + 1)
    const teacherSesssions = await this.prisma.buoiHoc.findMany({
      where: {
        lophoc: {
          giaovien: { ID: teacherDB.GiaoVienID },
          ID: { not: classId }
        },
        BatDauLuc: { gt: startDay, lt: endDay },
        TrangThai: 'SCHEDULED'
      }
    })
    for (var session of teacherSesssions) {
      const startAt = DateHelper.combineDateAndTime(body.date, body.startAt)
      const endAt = DateHelper.combineDateAndTime(body.date, body.endAt)
      if (session.BatDauLuc <= endAt && startAt <= session.KetThucLuc)
        throw new ConflictException(`Giáo viên trùng lịch dạy buổi học đó`)
    }
  }

  // kiểm tra quyền sở hữu và trạng thái buổi học
  private async SessionAcsessValidate(userId: number, sessionId: number) {
    const teacherDB = await this.GetTeacherByUserId(userId)
    const sessionDB = await this.prisma.buoiHoc.findUnique({
      where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } }
    })
    if (!sessionDB) throw new NotFoundException('Session not found or Access denied')
    if (sessionDB.TrangThai !== 'SCHEDULED')
      throw new ConflictException(`Session ID ${sessionDB.ID} is ${sessionDB.TrangThai}`)
    return { sessionDB, teacherId: teacherDB.ID }
  }

  // kiểm tra trùng phòng
  private async HasSameRoom(room: string, start: Date, end: Date, excludeId?: number) {
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
    if (conflict) throw new BadRequestException(`${room} is used by other session at this time`)
  }
}