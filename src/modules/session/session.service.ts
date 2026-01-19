import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDTO, SessionStatusDTO, UpdateSessionDTO } from "./session.dto";
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
    async GetSessionsByClassId(classId: number, query: SessionStatusDTO) {
        const where: Prisma.BuoiHocWhereInput = {}
        where.LopHocID = classId
        if (query.status)
            where.TrangThai = query.status
        const sessions = await this.prisma.buoiHoc.findMany({
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

        return await this.prisma.buoiHoc.update({
            where: { ID: sessionId },
            data: { ChuDe: body.topic, PhongHoc: body.room },
            select: { BuoiSo: true, ChuDe: true }
        })
    }

    // hủy buổi học kèm lý do
    async CancelSessionById(sessionId: number, reason: string) {
        const sessionDB = await this.SessionIdValidator(sessionId)
        if (sessionDB.TrangThai !== 'SCHEDULED')
            throw new ConflictException('Session is COMPLETED or already CANCELLED')
        if (!reason) throw new BadRequestException('Reason is missing')

        const updateSS = await this.prisma.buoiHoc.update({
            where: { ID: sessionId, TrangThai: 'SCHEDULED' },
            data: { MoTa: reason, TrangThai: 'CANCELLED' },
            select: {
                BatDauLuc: true, LopHocID: true,
                lophoc: {
                    select: {
                        ID:true, MaLopHoc: true,
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
        return { mgs: "Session cancelled and notify parent successfully" }

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

        if (!classDB) throw new NotFoundException('Class not found');

        const totalSessions = classDB.khoahoc.TongSoBuoi;
        const durationMonths = classDB.khoahoc.ThoiGian;

        // số buổi mỗi tháng
        const perChunk = Math.ceil(totalSessions / durationMonths)
        // số buổi đã có trong danh sách buổi học của lớp
        const currentCount = await this.prisma.buoiHoc.count({ where: { LopHocID: classId } })

        if (currentCount >= totalSessions)
            return { mes: 'No sessions to generate (already full)' }
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
        if (xday > endDate) return { mes: 'No sessions to generate (out of date range)' }

        // Mảng danh sách buổi học để đưa cho createMany()
        const data: Prisma.BuoiHocCreateManyInput[] = []
        let buoiSo = currentCount + 1

        while (xday <= endDate && data.length < need) {
            const dow = xday.getDay(); // 0..6
            if (classDB.LichHoc.includes(dow)) {
                const startAt = DateHelper.combineDateAndTime(xday, classDB.GioBatDau);
                const endAt = DateHelper.combineDateAndTime(xday, classDB.GioKetThuc);

                const conflict = await this.prisma.buoiHoc.findFirst({
                    where: {
                        PhongHoc: classDB.PhongHoc,
                        TrangThai: 'SCHEDULED',
                        BatDauLuc: { lt: endAt },
                        KetThucLuc: { gt: startAt }
                    }
                })
                if (!conflict) {
                    data.push({
                        LopHocID: classId, BuoiSo: buoiSo++,
                        BatDauLuc: startAt, KetThucLuc: endAt, PhongHoc: classDB.PhongHoc
                    })
                }
                else 
                    console.log(`skip ${xday} because duplicate with session ID ${conflict.ID}`)
            }
            xday.setDate(xday.getDate() + 1);
        }
        if (data.length === 0) return { mes: 'No sessions matched timetable in range' };

        await this.prisma.buoiHoc.createMany({
            data, skipDuplicates: true
        })
        return { mes: 'successful', created: data.length }
    }

    // tạo buổi học thủ công 
    async ManualGenerateSession(body: CreateSessionDTO) {
        const classDB = await this.prisma.lopHoc.findUnique({
            where: { ID: body.classId }
        })

        if (!classDB) throw new NotFoundException('Class not found')
        if (classDB.TrangThai === 'CLOSED')
            throw new ConflictException('Class already closed')

        DateHelper.ValidateTimeRange(body.startAt, body.endAt)
        const last = await this.prisma.buoiHoc.findFirst({
            where: { LopHocID: body.classId, TrangThai: { not: 'CANCELLED' } },
            orderBy: { BatDauLuc: 'desc' },
            select: { BatDauLuc: true },
        });
        const compareDate = last ? last.BatDauLuc : classDB.TuNgay
        if (body.date < compareDate)
            throw new ConflictException(`New session must greater than or equals ${compareDate}`)

        const startAt = DateHelper.combineDateAndTime(body.date, body.startAt)
        const endAt = DateHelper.combineDateAndTime(body.date, body.endAt)

        if (body.room) await this.HasSameRoom(body.room, startAt, endAt,)

        return await this.prisma.$transaction(async (tx) => {
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
                    BatDauLuc: startAt, KetThucLuc: endAt, PhongHoc: body.room
                },
                omit: { CreatedAt: true, UpdatedAt: true }
            })
        })
    }

    // lấy danh sách buổi học 1 lớp giáo viên A dạy 
    async GetSessionsByTeacherId(userId: number, classId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessions = await this.prisma.buoiHoc.findMany({
            where: { LopHocID: classId, lophoc: { GiaoVienID: teacherDB.ID } },
            omit: { ID: true, LopHocID: true, CreatedAt: true, UpdatedAt: true }
        })
        if (sessions.length === 0) throw new ForbiddenException('access denied')
        return sessions
    }

    // lấy thông tin buổi học và học viên có ghi danh ACTIVE
    async GetSession_Enrolls(userId: number, sessionId: number) {
        const teacherDB = await this.GetTeacherByUserId(userId)
        const sessionDB = await this.prisma.buoiHoc.findFirst({
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

    // lưu nháp kết quả buổi học - Draft
    async SaveDraftResult(userId: number, sessionId: number, body: SessionsResultDTO) {
        return await this.resultService.SaveDraftResult(userId, sessionId, body)
    }

    // lưu thật kết quả buổi học - Submit
    async SubmittedResult(userId: number, sessionId: number, body: SessionsResultDTO) {
        return await this.resultService.SubmittedResult(userId, sessionId, body)
    }

    // mở khóa lưu kết quả buổi học
    async UnclokSession(sessionId: number) {
        return await this.resultService.UnLokSession(sessionId)
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
                throw new ConflictException(`Teacher schedule conflict at this time `)
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
                TrangThai: { not: 'CANCELLED' },
                PhongHoc: room,// trùng phòng
                BatDauLuc: { lt: end },// trùng giờ
                KetThucLuc: { gt: start },
                ID: excludeId ? { not: excludeId } : undefined
            }
        })
        if (conflict) throw new BadRequestException(`${room} is used by other session at this time`)
    }
}