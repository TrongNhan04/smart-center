import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { NotifyService } from "../notify/notify.service";
import { SessionsResultDTO } from "./session-result.dto";
import { DateHelper } from "src/common/date.helper";

@Injectable()
export class SessionResultService {
    constructor(
        private prisma: PrismaService,
        private notisService: NotifyService
    ) { }

    // lưu NHÁP kết quả buổi học - DRAFT
    async SaveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
        // 1. Validate quyền & Lấy thông tin
        const { sessionDB, teacherId } = await this.SessionAcsessValidate(userId, sessionId)

        // 2. check thời gian cho phép lưu NHÁP
        const minutesLeftStart = DateHelper.CheckTimeWindow(sessionDB.BatDauLuc)
        const minutesLeftEnd = DateHelper.CheckTimeWindow(sessionDB.KetThucLuc)
        if (sessionDB.AdminMoKhoa == false) {
            if (minutesLeftStart > 15 || minutesLeftEnd < -2880)
                throw new BadRequestException(`Drafting is not allowed at this time`)
        }
        // 3. gọi hàm thục thi chung
        return await this.ProcessSessionResult(sessionDB, teacherId, body, 'DRAFT')
    }

    // lưu THẬT kết quả buổi học - SUBMITTED
    async SubmittedResult(userId: number, sessionId: number, body: SessionsResultDTO) {
        // 1. Validate quyền và lấy thông tin
        const { sessionDB, teacherId } = await this.SessionAcsessValidate(userId, sessionId)

        // 2. check thời gian cho lưu THẬT
        const minutesLeftEnd = DateHelper.CheckTimeWindow(sessionDB.KetThucLuc)
        if (!sessionDB.AdminMoKhoa) {
            if (minutesLeftEnd > 0 || minutesLeftEnd < -2880)
                throw new BadRequestException(`Submitting is not allowed at this time`)
        }
        // 3. lưu thật phải có nhận xét chung
        if (!body.comment) throw new ConflictException('Comment is missing')

        // 4. gọi hàm thực thi chung
        return await this.ProcessSessionResult(sessionDB, teacherId, body, 'SUBMITTED')
    }

    // lấy kết quả buổi học
    async GetSSResult(sessionId: number) {
        const sessionDB = await this.SessionIdValidator(sessionId)
        const [result, enrolls] = await Promise.all([
            this.prisma.ketQua_BuoiHoc.findFirst({
                where: { BuoiHocID: sessionDB.ID },
                include: { ketqua_chitiet: true }
            }),
            this.prisma.ghiDanh.findMany({
                where: { LopHocID: sessionDB.LopHocID, TrangThai: 'ACTIVE' },
                include: { hocvien: { include: { Parent: true } } }
            })
        ])
        if (!result)
            return enrolls.map(item => ({
                HocvienID: item.HocVienID,
                MaHocVien: item.hocvien.MaHocVien,
                TenHocVien: item.hocvien.TenHocVien,
                PhuHuynh: item.hocvien.Parent.HoTen,
                DienThoai: item.hocvien.Parent.DienThoai,
                Email: item.hocvien.Parent.Email,
            }))

        // tạo map key là ghi danh ID, value là tt của học viên, phụ huynh
        const newMapEnroll = new Map(enrolls.map(item => [item.ID, item]))
        return result.ketqua_chitiet.map(value => {

            // map qua KQCT, lấy value của newMap = ghidanhid của KQCT
            const data = newMapEnroll.get(value.GhiDanhID)
            if (!data) return // không tồn tại data cho ghi danh id đó
            return {
                HocVienID: data.HocVienID,
                MaHocVien: data.hocvien.MaHocVien,
                TenHocVien: data.hocvien.TenHocVien,
                PhuHuynh: data.hocvien.Parent.HoTen,
                DienThoai: data.hocvien.Parent.DienThoai,
                Email: data.hocvien.Parent.Email,
                DiemDanh: value.DiemDanh,
                NhanXet: value.NhanXetRieng ?? result.NhanXetChung,
                Diem: value.Diem
            }
        })
    }

    // mở khóa lưu kết quả buổi học
    async UnlockSession(sessionId: number) {
        const sessionDB = await this.SessionIdValidator(sessionId)
        if (sessionDB.TrangThai === 'CANCELLED')
            throw new ConflictException(`Session ID ${sessionId} is CANCELLED`)

        return await this.prisma.$transaction(async tx => {
            const now = new Date()
            if (now < sessionDB.KetThucLuc)
                throw new ConflictException('Chỉ được mở khóa những buổi học đã diễn ra')

            const sessionUp = await tx.buoiHoc.update({
                where: { ID: sessionId },
                data: {
                    AdminMoKhoa: true,
                    YeuCauMoKhoa: false
                },
                select: {
                    ID: true, BatDauLuc: true,
                    lophoc: {
                        select: {
                            TenLop: true,
                            giaovien: { select: { UserID: true } }
                        }
                    }
                }
            })
            await this.notisService.UnLockSSNotify(sessionUp.lophoc.giaovien.UserID, sessionUp)

            // return { msg: `Unlock session id ${sessionDB.ID} successfully` }
        })
    }

    // gửi yêu cầu mở khóa
    async RequestUnlock(userId: number, sessionId: number, reason: string) {
        const { sessionDB } = await this.SessionAcsessValidate(userId, sessionId)
        if (sessionDB.BatDauLuc > new Date())
            throw new BadRequestException('Session in the future, not to unlock')
        if (!reason) throw new BadRequestException('Reason is missing')
        await this.prisma.buoiHoc.update({
            where: { ID: sessionId },
            data: {
                YeuCauMoKhoa: true,
                LyDoMoKhoa: reason.trim(),
                NgayYeuCau: new Date()
            }
        })
        return { msg: "Send request successfully" }
    }

    // xử lý Transaction lưu DB, Dùng chung cho cả Draft và Submit
    private async ProcessSessionResult(session: any, teacherId: number,
        body: SessionsResultDTO, status: 'DRAFT' | 'SUBMITTED') {
        // lấy danh sách học viên Active của lớp có buổi học id đó
        const listEnroll = await this.prisma.ghiDanh.findMany({
            where: { LopHocID: session.LopHocID, TrangThai: 'ACTIVE' },
            select: { ID: true, hocvien: { select: { UserID: true } } }
        })
        // chuyển mảng input thành Map để tìm kiếm O(1)
        // key: enrollmentId, value: dữ liệu của body gửi lên 
        const inputMap = new Map(body.details.map(m => [m.enrollmentId, m]))
        const listParent = listEnroll.map(e => e.hocvien.UserID)

        return await this.prisma.$transaction(async tx => {
            // A. Upsert bảng KetQua_BuoiHoc
            const sessionResult = await tx.ketQua_BuoiHoc.upsert({
                where: { BuoiHocID: session.ID },
                create: {
                    BuoiHocID: session.ID,
                    GiaoVienID: teacherId,
                    NhanXetChung: body.comment ?? null,
                    TrangThai: status
                },
                update: {
                    NhanXetChung: body.comment ?? null,
                    TrangThai: status
                }
            })
            // B. Chuẩn bị lệnh Upsert Chi Tiết
            const upsertResultDetail = listEnroll.map(item => {
                // map qua listEnroll, lấy value của inputMap = id của listEnroll
                const details = inputMap.get(item.ID)

                // Nếu status là SUBMITTED -> Bắt buộc phải có dữ liệu input
                if (status === 'SUBMITTED') {
                    if (!details) throw new NotFoundException(`Student with enroll id ${item.ID} is not found`)
                    if (details.isAttend === null || details.isAttend === undefined)
                        throw new BadRequestException(`Student with enroll id ${item.ID} is missing Attendence`)
                }
                // Chuẩn bị data 
                const payLoad = {
                    DiemDanh: details?.isAttend ?? false,
                    NhanXetRieng: details?.privateComment ?? '',
                    Diem: details?.score ?? null
                }
                // không await để đưa cho promise.all
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
                        DiemDanh: payLoad.DiemDanh,
                        NhanXetRieng: payLoad.NhanXetRieng,
                        Diem: payLoad.Diem
                    },
                    update: {
                        DiemDanh: payLoad.DiemDanh,
                        NhanXetRieng: payLoad.NhanXetRieng,
                        Diem: payLoad.Diem
                    }
                })
            })
            // C. Kích hoạt song song
            await Promise.all(upsertResultDetail)
            // D. Nếu là SUBMITTED -> Cập nhật trạng thái buổi học
            if (status === 'SUBMITTED') {
                const bh = await tx.buoiHoc.update({
                    where: { ID: session.ID },
                    data: { TrangThai: 'COMPLETED', AdminMoKhoa: false }
                })
                await tx.lopHoc.updateMany({
                    where: { ID: bh.LopHocID, TrangThai: 'OPEN' },
                    data: { TrangThai: 'RUNNING' },
                })

                await this.notisService.CreateManyNotis(listParent, session)
            }
            return { mgs: status === 'DRAFT' ? "DRAFT saved" : "Submitted successfully" }
        })
    }

    // kiểm tra quyền sở hữu và trạng thái buổi học
    private async SessionAcsessValidate(userId: number, sessionId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessionDB = await this.prisma.buoiHoc.findUnique({
            where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } }
        })
        if (!sessionDB) throw new NotFoundException
            ('Không tìm thấy buổi học hoặc từ chối truy cập')
        if (sessionDB.TrangThai === 'CANCELLED')
            throw new ConflictException(`Buổi học đã hủy`)
        return { sessionDB, teacherId: teacherDB.ID }
    }

    // kiểm tra id buổi học
    private async SessionIdValidator(sessionId: number) {
        const sessionDB = await this.prisma.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB)
            throw new NotFoundException('Không tìm thấy buổi học')
        return sessionDB
    }

    // lấy giáo viên từ userId
    private async GetTeacherByUserId(userId: number) {
        const teacherDB = await this.prisma.giaoVien.findUnique({
            where: { UserID: userId }
        })
        if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Giáo viên đã ngừng hoạt động')
        return teacherDB
    }
}