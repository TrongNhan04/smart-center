import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { NotifyService } from "../notify/notify.service";
import { SessionsResultDTO } from "./session-result.dto";
import { DateHelper } from "src/common/date.helper";
import { BuoiHocUpdateInput, KetQua_BuoiHocUpdateInput } from "src/generated/prisma/models";

@Injectable()
export class SessionResultService {
  constructor(
    private prismaSv: PrismaService,
    private notisService: NotifyService
  ) { }

  // lưu NHÁP kết quả buổi học - DRAFT
  async saveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    // kiểm tra quyền và lấy thông tin 
    const { sessionDB, teacherId } = await this.SessionAcsessValidate(userId, sessionId)

    // kiểm tra quyền cho phép lưu NHÁP
    // const minutesLeftStart = DateHelper.TimeDiff(sessionDB.BatDauLuc)
    // const minutesLeftEnd = DateHelper.TimeDiff(sessionDB.KetThucLuc)
    // if (sessionDB.AdminMoKhoa == false) {
    //     if (minutesLeftStart < -15 || minutesLeftEnd > 2880) // quá giờ lưu
    //         throw new BadRequestException(`Ngoài thời gian cho phép lưu thông tin`)
    //     if (sessionDB.TrangThai === 'COMPLETED')// đã lưu thì không thao tác thêm hoặc xin admin
    //         throw new ConflictException('Buổi học đã chốt kết quả, vui lòng liên hệ quản trị viên')
    // }
    // 3. gọi hàm thục thi chung
    return await this.ProcessSessionResult(sessionDB, teacherId, body, 'DRAFT')
  }

  // lưu THẬT kết quả buổi học - SUBMITTED
  async submittedResult(userId: number, sessionId: number, body: SessionsResultDTO) {
    // validate quyền và lấy thông tin
    const { sessionDB, teacherId } = await this.SessionAcsessValidate(userId, sessionId)
    // check thời gian cho lưu THẬT
    // const minutesLeftEnd = DateHelper.TimeDiff(sessionDB.KetThucLuc)
    // if (!sessionDB.AdminMoKhoa) {
    //     if (minutesLeftEnd < 0 || minutesLeftEnd > 2880)
    //         throw new BadRequestException(`Ngoài thời gian cho phép chốt kết quả`)
    //     if (sessionDB.TrangThai === 'COMPLETED')// đã lưu thì không thao tác thêm hoặc xin admin
    //         throw new ConflictException('Buổi học đã chốt kết quả, vui lòng liên hệ quản trị viên')
    // }
    // lưu thật phải có nhận xét chung
    if (!body.NhanXetChung) throw new ConflictException('Thiếu nhận xét chung')

    // gọi hàm thực thi chung
    return await this.ProcessSessionResult(sessionDB, teacherId, body, 'SUBMITTED')
  }

  // lấy kết quả 1 buổi học
  async getSSResult(sessionId: number) {
    const sessionDB = await this.SessionIdValidator(sessionId)
    const [result, enrolls] = await Promise.all([
      this.prismaSv.ketQua_BuoiHoc.findFirst({
        where: { BuoiHocID: sessionDB.ID },
        include: { ketqua_chitiet: true }
      }),
      this.prismaSv.ghiDanh.findMany({
        where: { LopHocID: sessionDB.LopHocID, TrangThai: 'ACTIVE' },
        include: { hocvien: { include: { Parent: true } } },
        orderBy: { hocvien: { TenHocVien: 'asc' } }
      })
    ])
    // console.log(enrolls)
    const mapStudent = (item: any) => ({
      GhiDanhID: item.ID,
      MaHocVien: item.hocvien.MaHocVien,
      TenHocVien: item.hocvien.TenHocVien,
      PhuHuynh: item.hocvien.Parent.HoTen,
      DienThoai: item.hocvien.Parent.DienThoai,
      DiemDanh: null,
      NhanXetRieng: null,
      Diem: null
    })
    if (!result)
      return enrolls.map(item => mapStudent(item))

    // tạo map với key là ghi danh ID, value là kết quả học tập
    const newMapKQCT = new Map
      (result.ketqua_chitiet.map(item => [item.GhiDanhID, item]))
    return enrolls.map(value => { // mỗi value là ID (enroll) + thông tin học viên
      const data = newMapKQCT.get(value.ID)
      if (!data) return null // không tồn tại data cho ghi danh id đó
      return {
        ...mapStudent(value),
        DiemDanh: data.DiemDanh,
        NhanXetRieng: data.NhanXetRieng,
        Diem: data.Diem
      }
    }).filter(Boolean)
  }

  // mở khóa lưu kết quả buổi học
  async unlockSession(sessionId: number) {
    const sessionDB = await this.prismaSv.buoiHoc.findUnique({
      where: { ID: sessionId }
    })
    if (!sessionDB) throw new NotFoundException('Không tìm thấy buổi học')
    if (sessionDB.TrangThai === 'CANCELLED')
      throw new ConflictException(`Buổi học ID ${sessionId} đã hủy`)

    const isOverTime = DateHelper.TimeDiff(sessionDB.KetThucLuc)
    // nhỏ hơn 48h và chưa submit
    if (isOverTime < 2880 && sessionDB.TrangThai === 'SCHEDULED')
      throw new ConflictException(
        'Chỉ được mở khóa những buổi học quá hạn nộp kết quả')

    const sessionUp = await this.prismaSv.buoiHoc.update({
      where: { ID: sessionDB.ID },
      data: { AdminMoKhoa: true, YeuCauMoKhoa: false },
      include: {
        lophoc: {
          select: {
            TenLop: true, ID: true,
            giaovien: { select: { UserID: true } }
          }
        }
      }
    })
    const payload = {
      ID: sessionUp.ID, BatDauLuc: sessionUp.BatDauLuc,
      BuoiSo: sessionUp.BuoiSo,
      LopHocID: sessionUp.lophoc.ID, TenLop: sessionUp.lophoc.TenLop,
      UserID: sessionUp.lophoc.giaovien.UserID
    }
    await this.notisService.createUnLockSSNotify(payload)

  }

  // gửi yêu cầu mở khóa
  async RequestUnlock(userId: number, sessionId: number, reason: string) {
    const { sessionDB } = await this.SessionAcsessValidate(userId, sessionId)
    if (sessionDB.BatDauLuc > new Date())
      throw new BadRequestException('Buổi học chưa bị khóa, không thể gửi yêu cầu')
    if (!reason) throw new BadRequestException('Chưa điền lý do')
    return await this.prismaSv.buoiHoc.update({
      where: { ID: sessionDB.ID },
      data: {
        YeuCauMoKhoa: true,
        LyDoMoKhoa: reason.trim(),
        NgayYeuCau: new Date()
      }
    })
  }

  // xử lý Transaction lưu DB, Dùng chung cho cả Draft và Submit
  private async ProcessSessionResult(sessionDB: any, teacherId: number,
    body: SessionsResultDTO, status: 'DRAFT' | 'SUBMITTED') {

    // lấy danh sách học viên Active của lớp có buổi học id đó
    const listEnroll = await this.prismaSv.ghiDanh.findMany({
      where: { LopHocID: sessionDB.LopHocID, TrangThai: 'ACTIVE' },
      select: { ID: true, hocvien: { select: { UserID: true } } }
    })
    // key: enrollmentId, value: dữ liệu của body gửi lên 
    const inputMap = new Map(body.ChiTietKetQua.map(m => [m.GhiDanhID, m]))
    const listParent = listEnroll.map(e => e.hocvien.UserID)

    return await this.prismaSv.$transaction(async (tx) => {
      const fileAttach = body.TepDinhKem?.map(file => ({
        TepID: file.public_id,
        URL: file.url,
        LoaiTep: file.resource_type
      }))

      // Upsert bảng KetQua_BH và quan hệ 1-n của nó là tệp đính kèm
      const sessionResult = await tx.ketQua_BuoiHoc.upsert({
        where: { BuoiHocID: sessionDB.ID },
        update: {
          NoiDungBaiHoc: body.NoiDungBaiHoc, BaiTapVeNha: body.BaiTapVeNha,
          NhanXetChung: body.NhanXetChung, TrangThai: status,
          ...(fileAttach && {
            tep_dinhkem: {
              deleteMany: {},
              create: fileAttach
            }
          })
        },
        create: { // không có thì create
          BuoiHocID: sessionDB.ID, GiaoVienID: teacherId,
          NoiDungBaiHoc: body.NoiDungBaiHoc, BaiTapVeNha: body.BaiTapVeNha,
          NhanXetChung: body.NhanXetChung, TrangThai: status,
          ...(fileAttach && {
            tep_dinhkem: { create: fileAttach }
          })
        }
      })
      // Chuẩn bị lệnh Upsert Chi Tiết
      const isSubmitted = status === 'SUBMITTED'

      // dùng promise.all để upsert toàn bộ kết quả chi tiết
      await Promise.all(listEnroll.map(item => {
        const details = inputMap.get(item.ID)

        // Nếu status là SUBMITTED -> Bắt buộc phải có dữ liệu input
        if (isSubmitted) {
          if (!details) throw new NotFoundException(`Không tìm thấy học viên có ghi danh ID ${item.ID}`)
          if (details.DiemDanh === null || details.DiemDanh === undefined)
            throw new BadRequestException(`Học viên có ghi danh ID ${item.ID} chưa được điểm danh`)
        }
        // Chuẩn bị data 
        const payLoad = {
          DiemDanh: details?.DiemDanh ?? false,
          NhanXetRieng: details?.NhanXetRieng ?? null,
          Diem: details?.Diem ?? null
        }

        // không có await để đưa cho promise.all
        return tx.ketQua_ChiTiet.upsert({
          where: {
            KetQuaID_GhiDanhID: {
              KetQuaID: sessionResult.ID,
              GhiDanhID: item.ID
            }
          },
          create: {
            KetQuaID: sessionResult.ID,
            GhiDanhID: item.ID,
            ...payLoad
          },
          update: payLoad
        })
      }))

      // update buổi học
      await tx.buoiHoc.update({
        where: { ID: sessionDB.ID },
        data: {
          ChuDe: body.ChuDe,
          ...(isSubmitted && {
            AdminMoKhoa: false,
            TrangThai: 'COMPLETED'
          })
        }
      })
      // Nếu là SUBMITTED -> Cập nhật trạng thái buổi học 
      if (isSubmitted) {
        await tx.lopHoc.updateMany({ // update trạng thái lớp
          where: { ID: sessionDB.LopHocID, TrangThai: 'OPEN' },
          data: { TrangThai: 'RUNNING' },
        })
        // gửi thông báo cho phụ huynh
        await this.notisService.createMany(listParent, sessionDB, tx)
      }
    })
  }

  // kiểm tra quyền sở hữu và trạng thái buổi học
  private async SessionAcsessValidate(userId: number, sessionId: number) {
    const teacherDB = await this.GetTeacherByUserId(userId)
    const sessionDB = await this.prismaSv.buoiHoc.findUnique({
      where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } },
      include: { lophoc: true },
      omit: { CreatedAt: true, UpdatedAt: true }
    })
    if (!sessionDB) throw new NotFoundException
      ('Không tìm thấy buổi học hoặc từ chối truy cập')
    if (sessionDB.TrangThai === 'CANCELLED')
      throw new ConflictException(`Buổi học đã hủy`)
    const { lophoc, ...rest } = sessionDB // tách ra để lấy tên lớp
    return {
      sessionDB: {
        ...rest,
        LopHoc: lophoc.TenLop
      },
      teacherId: teacherDB.ID
    }
  }

  // kiểm tra id buổi học
  private async SessionIdValidator(sessionId: number) {
    const sessionDB = await this.prismaSv.buoiHoc.findUnique({
      where: { ID: sessionId }
    })
    if (!sessionDB)
      throw new NotFoundException('Không tìm thấy buổi học')
    return sessionDB
  }

  // lấy giáo viên từ userId
  private async GetTeacherByUserId(userId: number) {
    const teacherDB = await this.prismaSv.giaoVien.findUnique({
      where: { UserID: userId }
    })
    if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
    if (teacherDB.TrangThai === 'INACTIVE')
      throw new ConflictException('Giáo viên đã ngừng hoạt động')
    return teacherDB
  }
}