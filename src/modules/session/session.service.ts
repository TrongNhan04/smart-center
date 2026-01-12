import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSessionDTO } from "./session.dto";

@Injectable()
export class SessionService {
    constructor(private prismaService: PrismaService) { }

    //sửa buổi học, chỉ cho sửa chủ đề
    async UpdateSessionById(teacherId: number | null, sessionId: number, topic: string) {
        const where: Prisma.BuoiHocWhereInput = { ID: sessionId, TrangThai: 'SCHEDULED' }
        
        if (teacherId)
            where.lophoc = { giaovien: { ID: teacherId } }

        const sessionDB = this.prismaService.buoiHoc.findFirst({where})
        if (!sessionDB) throw new BadRequestException('Session is not existed or forbidden')
        return await this.prismaService.buoiHoc.update({
            where: { ID: sessionId }, data: { ChuDe: topic },
            select: {
                BuoiSo: true,
                ChuDe: true
            }
        })
    }

    // hủy buổi học kèm lý do
    async CancelSessionById(sessionId: number, reason: string) {
        const sessionDB = await this.prismaService.buoiHoc.findUnique({
            where: { ID: sessionId }
        })
        if (!sessionDB)
            throw new BadRequestException('Session is not existed')
        if (sessionDB.TrangThai !== 'SCHEDULED')
            throw new BadRequestException('Forbidden to action')
        if (!reason)
            throw new BadRequestException('Reason is missing')
        await this.prismaService.buoiHoc.update({
            where: {
                ID: sessionId,
                TrangThai: 'SCHEDULED'
            },
            data: {
                MoTa: reason,
                TrangThai: 'CANCELLED'
            }
        })

        return { mgs: "ok" }
    }

    // tạo buổi học tự động
    async AutoGenerateSession(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
            select: {// lịch học 0..6 theo getDay(), giờ học "18:03"
                ID: true, TuNgay: true, DenNgay: true,
                LichHoc: true, GioBatDau: true,
                GioKetThuc: true, TrangThai: true,
                khoahoc: { select: { TongSoBuoi: true, ThoiGian: true } },
            },
        });

        if (!classDB) throw new NotFoundException('Class not found');
        if (!classDB.khoahoc) throw new ConflictException('Course data is null');

        const totalSessions = classDB.khoahoc.TongSoBuoi;
        const durationMonths = classDB.khoahoc.ThoiGian;

        // số buổi mỗi tháng
        const perChunk = Math.ceil(totalSessions / durationMonths);
        // số buổi đã có trong dánh sách buổi học 
        const currentCount = await this.prismaService.buoiHoc.count({
            where: { LopHocID: classId }
        });

        if (currentCount >= totalSessions)
            return { mes: 'No sessions to generate (already full)' };
        //số buổi cần sinh = MIN của số buổi mỗi tháng và số buổi còn lại
        const need = Math.min(perChunk, totalSessions - currentCount);

        // xác định ngày của buổi cuối trong danh sách buổi học
        const last = await this.prismaService.buoiHoc.findFirst({
            where: { LopHocID: classId },
            orderBy: { BatDauLuc: 'desc' },
            select: { BatDauLuc: true },
        });
        // xác định ngày bắt đầu dò để buổi học học đúng lịch học
        let xday = last ? last.BatDauLuc : classDB.TuNgay //gán giá trị cho xday
        if (last) xday.setDate(xday.getDate() + 1)//dò từ ngày tiếp theo buổi cuối

        const endDate = classDB.DenNgay
        if (xday > endDate) return { mes: 'No sessions to generate (out of date range)' };

        // Mảng danh sách buổi học để đưa cho createMany()
        const data: Prisma.BuoiHocCreateManyInput[] = [];
        let buoiSo = currentCount + 1;

        while (xday <= endDate && data.length < need) {
            const dow = xday.getDay(); // 0..6
            if (classDB.LichHoc.includes(dow)) {
                const startAt = this.combineDateAndTime(xday, classDB.GioBatDau);
                const endAt = this.combineDateAndTime(xday, classDB.GioKetThuc);

                data.push({
                    LopHocID: classId, BuoiSo: buoiSo++,
                    BatDauLuc: startAt, KetThucLuc: endAt,
                });
            }
            xday.setDate(xday.getDate() + 1);
        }
        if (data.length === 0) return { mes: 'No sessions matched timetable in range' };

        await this.prismaService.buoiHoc.createMany({
            data, skipDuplicates: true
        });
        return { mes: 'successful', created: data.length };
    }

    // tạo buổi học thủ công 
    async ManualGenerateSession(classId: number, body: CreateSessionDTO) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })

        if (!classDB) throw new NotFoundException('Class not found')
        if (classDB.TrangThai === 'CLOSED')
            throw new ConflictException('Class already closed')

        this.Timetable_SizeValidator(body.startAt, body.endAt, 1)

        //body.date.setHours(0, 0, 0, 0)
        if (body.date < classDB.TuNgay)
            throw new ConflictException(`New session must greater than ${classDB.TuNgay}`)

        const startAt = this.combineDateAndTime(body.date, body.startAt)
        const endAt = this.combineDateAndTime(body.date, body.endAt)

        return await this.prismaService.$transaction(async (tx) => {
            // kiểm tra trùng buổi hoặc đè buổi trong cùng lớp
            const duplicate = await tx.buoiHoc.findFirst({
                where: {
                    LopHocID: classId,
                    BatDauLuc: { lt: endAt },//lớn hơn
                    KetThucLuc: { gt: startAt },// nhỏ hơn
                },
                select: { ID: true }
            })
            if (duplicate) throw new ConflictException('Overlap session')
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
                    BatDauLuc: startAt, KetThucLuc: endAt
                },
                omit: { CreatedAt: true, UpdatedAt: true }
            })
        })
    }

    // kiểm tra giáo viên có trống buổi đó không
    async CheckTeacherFree(classId: number, body: CreateSessionDTO) {
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
                BatDauLuc: {
                    gt: startDay,
                    lt: endDay
                }
            }
        })
        for (var session of teacherSesssions) {
            const startAt = this.combineDateAndTime(body.date, body.startAt)
            const endAt = this.combineDateAndTime(body.date, body.endAt)
            if (session.BatDauLuc <= endAt && startAt <= session.KetThucLuc)
                throw new ConflictException(`Teacher schedule conflict at this time `)
        }
    }

    //format giờ và phút
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

            if (startMinutes >= endMinutes)
                throw new ConflictException('End time must greater than start time')

            if (classSize < 0)
                throw new ConflictException('Class size must greater than 0')
        }
    }
}