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
        if (!sessionDB.AdminMoKhoa) {
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

    // mở khóa lưu kết quả buổi học
    async UnclokSession(sessionId: number) {
        const sessionDB = await this.SessionIdValidator(sessionId)
        if (sessionDB.TrangThai === 'SCHEDULED')
            throw new ConflictException(`Session ID ${sessionId} not locked`)

        return await this.prisma.$transaction(async tx => {
            await tx.ketQua_BuoiHoc.update({
                where: { BuoiHocID: sessionId },
                data: { TrangThai: 'DRAFT' }
            })
            await tx.buoiHoc.update({
                where: { ID: sessionId },
                data: { TrangThai: 'SCHEDULED', AdminMoKhoa: true }
            })
            const count = await tx.buoiHoc.count({
                where: { LopHocID: sessionDB.LopHocID, TrangThai: 'COMPLETED' }
            })
            if (count < 2) {
                await tx.lopHoc.update({
                    where: { ID: sessionDB.LopHocID },
                    data: { TrangThai: 'OPEN' }
                })
            }
            return { mgs: `Unclock session id ${sessionDB.ID} successfully` }
        })
    }

    // xử lý Transaction lưu DB, Dùng chung cho cả Draft và Submit
    private async ProcessSessionResult(session: any, teacherId: number,
        body: SessionsResultDTO, status: 'DRAFT' | 'SUBMITTED') {
        // lấy danh sách học viên Active
        const listEnroll = await this.prisma.ghiDanh.findMany({
            where: { LopHocID: session.LopHocID, TrangThai: 'ACTIVE' },
            select: { ID: true, hocvien: { select: { UserID: true } } }
        })
        // chuyển mảng input thành Map để tìm kiếm O(1)
        // key: enrollmentId, value: Data
        const inputMap = new Map(body.details.map(m => [m.enrollmentId, m]))
        const listParent = listEnroll.map(e => e.hocvien.UserID)
        return await this.prisma.$transaction(async tx => {
            // A. Upsert bảng Tổng Quát (KetQua_BuoiHoc)
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
            const upsertPromise = listEnroll.map(mx => {
                // ghi danh DB lấy kết quả trong inputMap(key, value)
                const details = inputMap.get(mx.ID)

                // Nếu status là SUBMITTED -> Bắt buộc phải có dữ liệu input
                if (status === 'SUBMITTED') {
                    if (!details) throw new NotFoundException(`Student with enroll id ${mx.ID} is not found`)
                    if (details.isAttend === null || details.isAttend === undefined)
                        throw new BadRequestException(`Student with enroll id ${mx.ID} is missing Attendence`)
                }
                // Chuẩn bị data 
                const payLoad = {
                    DiemDanh: details?.isAttend ?? false,
                    NhanXetRieng: details?.privateComment ?? '',
                    Diem: details?.score ?? null
                }

                return tx.ketQua_ChiTiet.upsert({
                    where: {
                        KetQuaID_GhiDanhID: {
                            KetQuaID: sessionResult.ID,
                            GhiDanhID: mx.ID
                        }
                    },
                    create: {
                        KetQuaID: sessionResult.ID,
                        GhiDanhID: mx.ID,
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
            await Promise.all(upsertPromise)
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
        if (!sessionDB) throw new NotFoundException('Session not found or Access denied')
        if (sessionDB.TrangThai !== 'SCHEDULED')
            throw new ConflictException(`Session ID ${sessionDB.ID} is ${sessionDB.TrangThai}`)
        return { sessionDB, teacherId: teacherDB.ID }
    }

    // kiểm tra id buổi học
    private async SessionIdValidator(sessionId: number) {
        const sessionDB = await this.prisma.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB)
            throw new NotFoundException('Session is not existed')
        return sessionDB
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
}