import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDTO, SessionsResultDTO, SessionStatusDTO, UpdateSessionDTO } from "./session.dto";

@Injectable()
export class SessionService {
    constructor(private prismaService: PrismaService) { }

    // lấy danh sách buổi học theo lớp
    async GetSessionsByClassId(classId: number, query: SessionStatusDTO) {
        const where: Prisma.BuoiHocWhereInput = {}
        where.LopHocID = classId
        if (query.status)
            where.TrangThai = query.status
        const sessions = await this.prismaService.buoiHoc.findMany({
            where,
            omit: { ID: true, CreatedAt: true, UpdatedAt: true }
        })
        if (!sessions.length) return { mgs: "Class don't have any session scheduled" }
        return sessions
    }

    //sửa buổi học: chủ đề + phòng học
    async UpdateSessionById(userId: number | null, sessionId: number, body: UpdateSessionDTO) {
        if (!userId) return { mgs: "You are ADMIN?" }
        const { sessionDB } = await this.SessionAcsessValidate(userId, sessionId)
        if (body.room) await this.HasSameRoom(body.room, sessionDB.BatDauLuc, sessionDB.KetThucLuc, sessionDB.ID)
            
        return await this.prismaService.buoiHoc.update({
            where: { ID: sessionId },
            data: { ChuDe: body.topic, PhongHoc: body.room },
            select: { BuoiSo: true, ChuDe: true }
        })
    }

    // hủy buổi học kèm lý do
    async CancelSessionById(sessionId: number, reason: string) {
        await this.SessionIdValidator(sessionId)
        if (!reason) throw new BadRequestException('Reason is missing')

        await this.prismaService.buoiHoc.update({
            where: { ID: sessionId, TrangThai: 'SCHEDULED' },
            data: { MoTa: reason, TrangThai: 'CANCELLED' }
        })
        return { mgs: "ok" }
    }

    // tạo buổi học tự động
    async AutoGenerateSession(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
            select: {// lịch học 0..6 theo getDay(), giờ học "18:03"
                ID: true, TuNgay: true, DenNgay: true,
                LichHoc: true, GioBatDau: true, PhongHoc: true,
                GioKetThuc: true, TrangThai: true,
                khoahoc: { select: { TongSoBuoi: true, ThoiGian: true } }
            }
        })

        if (!classDB) throw new NotFoundException('Class not found');

        const totalSessions = classDB.khoahoc.TongSoBuoi;
        const durationMonths = classDB.khoahoc.ThoiGian;

        // số buổi mỗi tháng
        const perChunk = Math.ceil(totalSessions / durationMonths)
        // số buổi đã có trong danh sách buổi học của lớp
        const currentCount = await this.prismaService.buoiHoc.count({ where: { LopHocID: classId } })

        if (currentCount >= totalSessions)
            return { mes: 'No sessions to generate (already full)' }
        //số buổi cần sinh = MIN của số buổi mỗi tháng và số buổi còn lại
        const need = Math.min(perChunk, totalSessions - currentCount)

        // xác định ngày của buổi cuối trong danh sách buổi học
        const last = await this.prismaService.buoiHoc.findFirst({
            where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } },
            orderBy: { BatDauLuc: 'desc' },
            select: { BatDauLuc: true }
        })
        // xác định ngày bắt đầu dò để buổi học đúng lịch học
        let xday = last ? last.BatDauLuc : classDB.TuNgay //gán giá trị cho xday
        if (last) xday.setDate(xday.getDate() + 1)//dò từ ngày tiếp theo buổi cuối

        const endDate = classDB.DenNgay
        if (xday > endDate) return { mes: 'No sessions to generate (out of date range)' }

        // Mảng danh sách buổi học để đưa cho createMany()
        const data: Prisma.BuoiHocCreateManyInput[] = []
        let buoiSo = currentCount + 1

        while (xday <= endDate && data.length < need) {
            const dow = xday.getDay(); // 0..6
            if (classDB.LichHoc.includes(dow)) {
                const startAt = this.combineDateAndTime(xday, classDB.GioBatDau);
                const endAt = this.combineDateAndTime(xday, classDB.GioKetThuc);
                data.push({
                    LopHocID: classId, BuoiSo: buoiSo++,
                    BatDauLuc: startAt, KetThucLuc: endAt, PhongHoc: classDB.PhongHoc
                });
            }
            xday.setDate(xday.getDate() + 1);
        }
        if (data.length === 0) return { mes: 'No sessions matched timetable in range' };

        await this.prismaService.buoiHoc.createMany({
            data, skipDuplicates: true
        })
        return { mes: 'successful', created: data.length }
    }

    // tạo buổi học thủ công 
    async ManualGenerateSession(body: CreateSessionDTO) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: body.classId }
        })

        if (!classDB) throw new NotFoundException('Class not found')
        if (classDB.TrangThai === 'CLOSED')
            throw new ConflictException('Class already closed')

        this.Timetable_SizeValidator(body.startAt, body.endAt, 1)
        const last = await this.prismaService.buoiHoc.findFirst({
            where: { LopHocID: body.classId, TrangThai:{not :'CANCELLED'} },
            orderBy: { BatDauLuc: 'desc' },
            select: { BatDauLuc: true },
        });
        const compareDate = last ? last.BatDauLuc : classDB.TuNgay
        if (body.date < compareDate)
            throw new ConflictException(`New session must greater than or equals ${compareDate}`)

        const startAt = this.combineDateAndTime(body.date, body.startAt)
        const endAt = this.combineDateAndTime(body.date, body.endAt)

        if (body.room) await this.HasSameRoom(body.room, startAt, endAt,)

        return await this.prismaService.$transaction(async (tx) => {
            // kiểm tra trùng buổi hoặc đè buổi trong cùng lớp
            const duplicate = await tx.buoiHoc.findFirst({
                where: {
                    LopHocID: body.classId,
                    BatDauLuc: { lt: endAt },//lớn hơn
                    KetThucLuc: { gt: startAt },// nhỏ hơn
                },
                select: { ID: true }
            })
            if (duplicate) throw new ConflictException('Overlap session')
            await this.CheckTeacherFree(body.classId, body)
            // BuoiSo = max + 1 
            const max = await tx.buoiHoc.findFirst({
                where: { LopHocID: body.classId },
                orderBy: { BuoiSo: 'desc' },
                select: { BuoiSo: true }
            })
            const nextSs = (max?.BuoiSo ?? 0) + 1

            return await tx.buoiHoc.create({
                data: {
                    BuoiSo: nextSs, LopHocID: body.classId, ChuDe: body.topic,
                    BatDauLuc: startAt, KetThucLuc: endAt
                },
                omit: { CreatedAt: true, UpdatedAt: true }
            })
        })
    }

    // lấy danh sách buổi học 1 lớp giáo viên A dạy 
    async GetSessionsByTeacherId(userId: number, classId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessions = await this.prismaService.buoiHoc.findMany({
            where: { LopHocID: classId, lophoc: { GiaoVienID: teacherDB.ID } },
            omit: { ID: true, LopHocID: true, CreatedAt: true, UpdatedAt: true }
        })
        if (sessions.length === 0) throw new ForbiddenException('access denied')
        return sessions
    }

    // lấy thông tin buổi học và học viên có ghi danh ACTIVE
    async GetSession_Enrolls(userId: number, sessionId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessionDB = await this.prismaService.buoiHoc.findFirst({
            where: {
                ID: sessionId,
                lophoc: { GiaoVienID: teacherDB.ID }// thầy nào lớp nấy
            },
            select: {
                ID: true, ChuDe: true,
                BatDauLuc: true, KetThucLuc: true,
                lophoc: {
                    select: {
                        ghidanh: {
                            where: { TrangThai: 'ACTIVE' },
                            select: {
                                hocvien: {
                                    select: {
                                        MaHocVien: true, TenHocVien: true, TenPhuHuynh: true,
                                        Parent: { select: { Email: true, DienThoai: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if (!sessionDB) throw new NotFoundException('Session not found or forbidden')

        if (sessionDB.lophoc.ghidanh.length === 0)
            throw new BadRequestException("Class has no active enrollments")

        const studentMap = sessionDB.lophoc.ghidanh.map(x => ({
            MaHocVien: x.hocvien.MaHocVien, TenHocVien: x.hocvien.TenHocVien,
            TenPhuHuynh: x.hocvien.TenPhuHuynh, DienThoai: x.hocvien.Parent.DienThoai
        }))

        return {
            sessions: {
                id: sessionDB.ID, topic: sessionDB.ChuDe,
                date: sessionDB.BatDauLuc.toISOString().slice(0, 10),
                time: sessionDB.BatDauLuc.toISOString().slice(11, 16) + "-" + sessionDB.KetThucLuc.toISOString().slice(11, 16)
            },
            students: studentMap
        }
    }

    // lưu NHÁP kết quả buổi học - DRAFT
    async SaveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
        // 1. Validate quyền & Lấy thông tin
        const { sessionDB, teacherId } = await this.SessionAcsessValidate(userId, sessionId)

        // 2. check thời gian cho phép lưu NHÁP
        const minutesLeftStart = this.CheckTimeWindow(sessionDB.BatDauLuc)
        const minutesLeftEnd = this.CheckTimeWindow(sessionDB.KetThucLuc)
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
        const minutesLeftEnd = this.CheckTimeWindow(sessionDB.KetThucLuc)
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

        return await this.prismaService.$transaction(async tx => {
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

    // format giờ và phút
    private parseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number);
        return { h, m };
    }

    // ghép ngày và giờ
    private combineDateAndTime(dateOnly: Date, hhmm: string) {
        const { h, m } = this.parseHHmm(hhmm);
        const d = new Date(dateOnly);
        d.setHours(h, m, 0, 0);
        return d;
    }

    // kiểm tra giờ bắt đầu + kết thúc và sĩ số
    private Timetable_SizeValidator(startTime?: string, endTime?: string, classSize?: number) {
        if (startTime && endTime && classSize) {
            // tách giờ bởi dấu ":" và chuyển thành số 
            const startTimeSplit = startTime.split(":").map(Number)
            // tổng số phút = giờ * 60 + phút --> để so sánh
            const startMinutes = startTimeSplit[0] * 60 + startTimeSplit[1]
            const endTimeSplit = endTime.split(":").map(Number)
            const endMinutes = endTimeSplit[0] * 60 + endTimeSplit[1]

            if (startMinutes < 420 || endMinutes > 1260)// 7h-21h
                throw new ConflictException('Open from 7am to 9pm')
            if (startMinutes >= endMinutes)
                throw new ConflictException('End time must greater than start time')
            if (classSize < 0)
                throw new ConflictException('Class size must greater than 0')
        }
    }

    // lấy giáo viên từ userId
    private async GetTeacherByUserId(userId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { UserID: userId }
        })
        if (!teacherDB) throw new NotFoundException('Teacher not found')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Teacher was INACTIVE')
        return teacherDB
    }

    // kiểm tra lịch - hiện tại = bao nhiêu phút
    private CheckTimeWindow(time: Date) {
        const now = new Date().getTime()
        const timeLeft = time.getTime() - now
        return Math.floor(timeLeft / 60000)
    }

    // kiểm tra id session
    private async SessionIdValidator(sessionId: number) {
        const sessionDB = await this.prismaService.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB)
            throw new NotFoundException('Session is not existed')
        return sessionDB
    }

    // kiểm tra giáo viên có trống buổi đó không
    private async CheckTeacherFree(classId: number, body: CreateSessionDTO) {
        const teacherDB = await this.prismaService.lopHoc.findUnique({
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
        const teacherSesssions = await this.prismaService.buoiHoc.findMany({
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
            const startAt = this.combineDateAndTime(body.date, body.startAt)
            const endAt = this.combineDateAndTime(body.date, body.endAt)
            if (session.BatDauLuc <= endAt && startAt <= session.KetThucLuc)
                throw new ConflictException(`Teacher schedule conflict at this time `)
        }
    }

    // kiểm tra quyền sở hữu và trạng thái buổi học
    private async SessionAcsessValidate(userId: number, sessionId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessionDB = await this.prismaService.buoiHoc.findUnique({
            where: { ID: sessionId, lophoc: { GiaoVienID: teacherDB.ID } }
        })

        if (!sessionDB) throw new NotFoundException('Session not found or Access denied')
        if (sessionDB.TrangThai !== 'SCHEDULED')
            throw new ConflictException(`Session ID ${sessionDB.ID} is ${sessionDB.TrangThai}`)
        return { sessionDB, teacherId: teacherDB.ID }
    }

    // xử lý Transaction lưu DB, Dùng chung cho cả Draft và Submit
    private async ProcessSessionResult(session: any, teacherId: number,
        body: SessionsResultDTO, status: 'DRAFT' | 'SUBMITTED') {
        // lấy danh sách học viên Active
        const listEnroll = await this.prismaService.ghiDanh.findMany({
            where: { LopHocID: session.LopHocID, TrangThai: 'ACTIVE' }
        })
        // chuyển mảng input thành Map để tìm kiếm O(1)
        // key: enrollmentId, value: Data
        const inputMap = new Map(body.details.map(m => [m.enrollmentId, m]))

        return await this.prismaService.$transaction(async tx => {
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
                // Chuẩn bị data (Dùng ?? để fallback nếu là Draft)
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
            }
            return { mgs: status === 'DRAFT' ? "DRAFT saved" : "Submitted successfully" }
        })
    }

    // kiểm tra trùng phòng
    private async HasSameRoom(room: string, start: Date, end: Date, excludeId?: number) {
        if (!room) return
        const conflict = await this.prismaService.buoiHoc.findFirst({
            where: {
                PhongHoc: room,// trùng phòng
                BatDauLuc: { lt: end },// trùng giờ
                KetThucLuc: { gt: start },
                ID: excludeId ? { not: excludeId } : undefined
            }
        })
        if (conflict) throw new BadRequestException(`${room} is used by other session at this time`)
    }
}