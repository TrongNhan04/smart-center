import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassQueryDTO, ClassUpdateDTO, CreateClassDTO } from "./class.dto";
import { Prisma } from "src/generated/prisma/client";
import { CreateSessionDTO, SessionStatusDTO } from "../session/session.dto";

@Injectable()
export class ClassService {
    constructor(
        private prismaService: PrismaService
    ) {}

    //kiểm tra trùng mã lớp 
    async ClassValidator(code: string) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { MaLopHoc: code }
        })
        if (classDB)
            throw new ConflictException('Code class has existed')
    }

    //kiểm tra id khóa học 
    async CourseValidator(courseId: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB)// nếu không tồn tại khóa học
            throw new ConflictException('This course is not found')
        if (courseDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Course cannot create a new class')
    }

    //kiểm tra id giáo viên
    async TeacherValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId }
        })
        if (teacherDB == null)
            throw new ConflictException('This teacher is not found')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Teacher is retire')
    }

    //kiểm tra ngày 
    async FromDateToDayValidator(fromDate: string, toDate: string) {
        const fd = new Date(fromDate)
        const td = new Date(toDate)
        if (td <= fd)
            throw new ConflictException('To date must greater than from date')
    }

    // kiểm tra thời gian bắt đầu, kết thúc và sĩ số
    async Timetable_SizeValidator(startTime: string, endTime: string, classSize: number) {
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

    // kiểm tra lớp tồn tại theo id
    async ClassIDValidator(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
        })
        if (!classDB) throw new BadRequestException('Class is not existed')
        return classDB
    }

    // thêm lớp mới
    async CreateClass(classDTO: CreateClassDTO) {
        await this.ClassValidator(classDTO.code)
        await this.CourseValidator(classDTO.courseId)
        await this.TeacherValidator(classDTO.teacherId)
        await this.Timetable_SizeValidator(classDTO.startTime, classDTO.endTime, classDTO.classSize)
        await this.FromDateToDayValidator(classDTO.fromDate, classDTO.toDate)

        await this.prismaService.$transaction([
            this.prismaService.lopHoc.create({
                data: {
                    MaLopHoc: classDTO.code,
                    TenLop: classDTO.name,
                    KhoaHocID: classDTO.courseId,
                    GiaoVienID: classDTO.teacherId,
                    TuNgay: classDTO.fromDate,
                    DenNgay: classDTO.toDate,
                    LichHoc: classDTO.timeTable,
                    GioBatDau: classDTO.startTime,
                    GioKetThuc: classDTO.endTime,
                    SiSo: classDTO.classSize,
                    MoTa: classDTO.description
                }
            }),
            this.prismaService.khoaHoc.update({
                where: {
                    ID: classDTO.courseId,
                    TrangThai: 'DRAFT',
                },
                data: {
                    TrangThai: 'ACTIVE'
                }
            })
        ])
        return { mgs: "succesfull" }
    }

    // lấy danh sách lớp mặc đinh hoặc query
    async GetClasses(query: ClassQueryDTO) {
        // tạo điều kiện where
        const where: Prisma.LopHocWhereInput = {}
        const q = query?.q?.trim()

        if (query.status)// nếu trạng thái có thì where theo
            where.TrangThai = query.status
        else // không thì có 1 trong các trạng thái
            where.TrangThai = { in: ['OPEN', 'RUNNING'] }
        if (q) {// nếu có câu truy vấn như tìm tên lớp, mã lớp, tên giáo viên,..
            where.OR = [
                // theo mã hoặc tên lớp
                { MaLopHoc: { contains: q, mode: 'insensitive' } },
                { TenLop: { contains: q, mode: 'insensitive' } },
                // theo tên giáo viên từ bảng giáo viên
                { giaovien: { HoTen: { contains: q, mode: 'insensitive' } } }
            ]
        }
        return await this.prismaService.lopHoc.findMany({
            where,
            omit: {
                CreatedAt: true,
                updatedAt: true,
            }
        })
    }

    // lấy chi tiết lớp - phần trên
    async GetClassById(classId: number) {
        return await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
            omit: {
                ID: true,
                updatedAt: true,
                CreatedAt: true
            }
        })
    }

    // cập nhật lớp theo trạng thái
    async UpdateClassById(classId: number, up: ClassUpdateDTO) {
        await this.Timetable_SizeValidator(up.startTime, up.endTime, up.classSize)
        await this.FromDateToDayValidator(up.fromDate, up.toDate)
        await this.TeacherValidator(up.teacherId)
        const classDB = await this.ClassIDValidator(classId)

        const data: Prisma.LopHocUpdateInput = {}
        // đếm buổi học của lớp
        const countSession = await this.prismaService.buoiHoc.count({
            where: { LopHocID: classId }
        })
        if (classDB.TrangThai === 'OPEN') {
            data.TenLop = up.name
            data.MoTa = up.description
            data.TrangThai = up.status
            data.SiSo = up.classSize
            data.giaovien = { connect: { ID: up.teacherId } }
            // nếu không có buổi học thì cho sửa thêm
            if (countSession == 0) {
                data.TuNgay = up.fromDate
                data.DenNgay = up.toDate
                data.LichHoc = up.timeTable
                data.GioBatDau = up.startTime
                data.GioKetThuc = up.endTime
            }
        }

        if (classDB.TrangThai === 'RUNNING') {
            data.giaovien = { connect: { ID: up.teacherId } }
            data.TenLop = up.name
            data.MoTa = up.description
            if (up.status === 'CLOSED')
                data.TrangThai = 'CLOSED'
        }
        return await this.prismaService.lopHoc.update({
            where: { ID: classId },
            data,
            omit: {
                CreatedAt: true,
                updatedAt: true
            }
        })
    }

    // xóa mềm lớp học, hủy ghi danh và các buổi học chưa diễn ra
    async DeleteClassByID(classId: number) {
        // nếu hủy lớp OPEN hoặc RUNNING thì hủy ghi danh: STOPPED 
        // và hủy các buổi học SCHEDULED -> CANCELLED 
        const classDB = await this.ClassIDValidator(classId)
        if (classDB.TrangThai !== 'CLOSED') {
            await this.prismaService.$transaction([
                this.prismaService.lopHoc.update({
                    where: { ID: classId },
                    data: { TrangThai: 'CLOSED' }
                }),
                this.prismaService.ghiDanh.updateMany({
                    where: {
                        LopHocID: classId,
                        TrangThai: { in: ['ACTIVE', 'PENDING'] }
                    },
                    data: { TrangThai: 'STOPPED' }
                }),
                this.prismaService.buoiHoc.updateMany({
                    where: {
                        LopHocID: classId,
                        TrangThai: 'SCHEDULED'
                    },
                    data: { TrangThai: 'CANCELED' }
                })
            ])
        }
        return { meg: "Closed or already closed" }
    }

    // lấy danh sách buổi học theo lớp - phần dưới
    async GetSessionsByClassId(classId: number, query: SessionStatusDTO) {
        const classDB = await this.ClassIDValidator(classId)
        if (classDB.TrangThai === 'CLOSED')
            throw new BadRequestException(`Class ${classDB.TenLop} is closed`)

        const where: Prisma.BuoiHocWhereInput = {}
        where.LopHocID = classId
        if (query.status)
            where.TrangThai = query.status
        else
            where.TrangThai = { in: ['SCHEDULED', 'COMPLETED'] }
        return await this.prismaService.buoiHoc.findMany({
            where,
            omit: {
                ID: true,
                CreatedAt: true,
                updatedAt: true
            }
        })
    }

    //format giờ và phút
    parseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number);
        return { h, m };
    }

    // ghép ngày và giờ
    combineDateAndTime(dateOnly: Date, hhmm: string) {
        const { h, m } = this.parseHHmm(hhmm);
        const d = new Date(dateOnly);
        d.setHours(h, m, 0, 0);
        return d;
    }

    // tự động tạo buổi học
    async AutoGenerateSession(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
            select: {
                ID: true,
                TuNgay: true,
                DenNgay: true,
                LichHoc: true,      // 0..6 theo getDay()
                GioBatDau: true,    // "08:30"
                GioKetThuc: true,   // "10:30"
                TrangThai: true,
                khoahoc: { select: { TongSoBuoi: true, ThoiGian: true } },
            },
        });

        if (!classDB) throw new ConflictException('Class not found');
        if (!classDB.khoahoc) throw new ConflictException('Course data is null');

        const totalSessions = classDB.khoahoc.TongSoBuoi;
        const durationMonths = classDB.khoahoc.ThoiGian;

        // số buổi mỗi tháng
        const perChunk = Math.ceil(totalSessions / durationMonths);
        // số buổi đã có trong dánh sách buổi học 
        const currentCount = await this.prismaService.buoiHoc.count({
            where: { LopHocID: classId }
        });
        if (currentCount >= totalSessions + 4)
            return { mes: 'No sessions to generate (already full)' };
        //số buổi cần sinh = min của số buổi mỗi tháng và số buổi còn lại
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
                    LopHocID: classId,
                    BuoiSo: buoiSo++,
                    BatDauLuc: startAt,
                    KetThucLuc: endAt,
                });
            }
            xday.setDate(xday.getDate() + 1);
        }

        if (data.length === 0) return { mes: 'No sessions matched timetable in range' };

        await this.prismaService.buoiHoc.createMany({
            data,
            skipDuplicates: true,
        });

        return { mes: 'successful', created: data.length };
    }

    // tạo buổi học thủ công 
    async ManualGenerateSession(classId: number, body: CreateSessionDTO) {
        const classDB = await this.ClassIDValidator(classId)
        if (classDB.TrangThai === 'CLOSED')
            throw new ConflictException('Class already closed')

        await this.Timetable_SizeValidator(body.startAt, body.endAt, 1)

        const xdate = new Date(body.date)
        if (xdate >= classDB.DenNgay || xdate < classDB.TuNgay)
            throw new ConflictException(`New session must from ${classDB.TuNgay} to ${classDB.DenNgay}`)

        const nos = await this.prismaService.buoiHoc.count({ where: { LopHocID: classId } })

        if (!classDB.LichHoc.includes(xdate.getDay()))
            throw new ConflictException(`New session must on the timetable`)

        const startAt = this.combineDateAndTime(xdate, body.startAt)
        const endAt = this.combineDateAndTime(xdate, body.endAt)

        return await this.prismaService.$transaction(async (tx) => {
            // kiểm tra trùng buổi hoặc đè buổi trong cùng lớp
            const duplicate = await tx.buoiHoc.findFirst({
                where: {
                    LopHocID: classId,
                    BatDauLuc: { lt: endAt },
                    KetThucLuc: { gt: startAt }
                },
                select: { ID: true }
            })
            if (duplicate) throw new ConflictException('Duplicate session')
            
            // BuoiSo = max + 1 
            const max = await tx.buoiHoc.findFirst({
                where: { LopHocID: classId },
                orderBy: { BuoiSo: 'desc' },
                select: { BuoiSo: true }
            })
            const nextSs = Math.max(max?.BuoiSo ?? 0, 1) + 1

            return await tx.buoiHoc.create({
                data:{
                    LopHocID: classId,
                    ChuDe: body.topic,
                    MoTa: body.description,
                    BatDauLuc: startAt,
                    KetThucLuc: endAt,
                    BuoiSo: nextSs
                },
                omit:{
                    CreatedAt:true,
                    updatedAt:true
                }
            })
        })
    }
}