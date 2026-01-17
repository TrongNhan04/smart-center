import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryClassDTO, UpdateClassDTO, CreateClassDTO } from "./class.dto";
import { Prisma } from "src/generated/prisma/client";
import { SessionStatusDTO } from "../session/session.dto";
import { SessionService } from "../session/session.service";

@Injectable()
export class ClassService {
    constructor(
        private prismaService: PrismaService,
        private sessionService: SessionService
    ) { }

    //kiểm tra trùng mã lớp 
    private async ClassValidator(code: string) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { MaLopHoc: code }
        })
        if (classDB)
            throw new ConflictException('Code class has existed')
    }

    // kiểm tra id lớp
    private async ClassIDValidator(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })
        if (!classDB) throw new NotFoundException('Class is not found')
        return classDB
    }

    // thêm lớp mới
    async CreateClass(classDTO: CreateClassDTO) {
        await this.ClassValidator(classDTO.code)
        await this.CourseValidator(classDTO.courseId)
        await this.TeacherValidator(classDTO.teacherId)
        this.Timetable_SizeValidator(classDTO.startTime, classDTO.endTime, classDTO.classSize)
        this.FromDateToDateValidator(classDTO.fromDate, classDTO.toDate)
        await this.DuplicateClass(classDTO.teacherId, classDTO.fromDate, classDTO.toDate,
            classDTO.timeTable, classDTO.startTime, classDTO.endTime, null)
        const toDate = new Date(classDTO.toDate)
        toDate.setDate(toDate.getDate() + 1)

        await this.prismaService.$transaction([
            this.prismaService.lopHoc.create({
                data: {
                    MaLopHoc: classDTO.code,
                    TenLop: classDTO.name,
                    KhoaHocID: classDTO.courseId,
                    GiaoVienID: classDTO.teacherId,
                    TuNgay: classDTO.fromDate,
                    DenNgay: toDate,
                    LichHoc: classDTO.timeTable,
                    GioBatDau: classDTO.startTime,
                    GioKetThuc: classDTO.endTime,
                    SiSo: classDTO.classSize,
                }
            }),
            this.prismaService.khoaHoc.updateMany({
                where: { ID: classDTO.courseId, TrangThai: 'DRAFT' },
                data: { TrangThai: 'ACTIVE' }
            })
        ])
        return { mgs: "succesfull" }
    }

    // lấy danh sách lớp mặc đinh hoặc query
    async GetClasses(query: QueryClassDTO) {
        // tạo điều kiện where
        const condition: Prisma.LopHocWhereInput[] = []
        //if (userId) condition.push({ giaovien: { UserID: userId } })
        if (query.status) condition.push({ TrangThai: query.status })
        const q = query?.q?.trim()
        if (q) {// nếu có câu truy vấn như tìm tên lớp, mã lớp, tên giáo viên,..
            condition.push({
                OR: [
                    { MaLopHoc: { contains: q, mode: 'insensitive' } },
                    { TenLop: { contains: q, mode: 'insensitive' } },
                    { giaovien: { HoTen: { contains: q, mode: 'insensitive' } } }
                ]
            })
        }
        return await this.prismaService.lopHoc.findMany({
            where: { AND: condition },
            omit: {
                CreatedAt: true,
                UpdatedAt: true,
            }
        })
    }

    // lấy chi tiết lớp - phần trên
    async GetClassById(classId: number) {
        await this.ClassIDValidator(+classId)
        return await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
            omit: {
                ID: true,
                UpdatedAt: true,
                CreatedAt: true
            }
        })
    }

    // lấy danh sách lớp theo id khóa học
    async GetClassesByCourseId(courseId: number) {
        return await this.prismaService.lopHoc.findMany({
            where: { KhoaHocID: courseId },
            omit: {
                ID: true,
                CreatedAt: true,
                UpdatedAt: true
            }
        })
    }

    // cập nhật lớp theo trạng thái
    async UpdateClassById(classId: number, up: UpdateClassDTO) {
        const classDB = await this.ClassIDValidator(classId)
        // đếm buổi học của lớp
        const countSession = await this.prismaService.buoiHoc.count({
            where: { LopHocID: classId }
        })

        // Lớp RUNNING & OPEN có buổi học
        if (classDB.TrangThai === 'RUNNING' || (classDB.TrangThai === 'OPEN' && countSession > 0)) {
            if (up.fromDate || up.toDate || up.timeTable)
                throw new BadRequestException('Cannot do it for running class')
            if (up.startTime || up.endTime)
                throw new BadRequestException('Timetable is not change')
        }

        const name = up.name ?? classDB.TenLop
        const description = up.description ?? classDB.MoTa
        const size = up.classSize ?? classDB.SiSo

        const fromDate = up.fromDate ?? classDB.TuNgay
        const toDate = up.toDate ?? classDB.DenNgay
        const timeTable = up.timeTable ?? classDB.LichHoc
        const startTime = up.startTime ?? classDB.GioBatDau
        const endTime = up.endTime ?? classDB.GioKetThuc

        // đổi giáo viên
        if (up.teacherId) {
            await this.TeacherValidator(up.teacherId)
            await this.ChangeTeacher(classId, up, classId)// kiểm tra giáo viên có rảnh không
        }

        if (up.room) await this.HasSameRoom(up.room, fromDate, toDate, timeTable, startTime, endTime, classDB.ID)

        this.FromDateToDateValidator(fromDate, toDate)
        this.Timetable_SizeValidator(startTime, endTime, size)

        return await this.prismaService.$transaction(async (tx) => {
            await tx.lopHoc.update({
                where: { ID: classId },
                data: {
                    TenLop: name, MoTa: description, SiSo: size,
                    TuNgay: fromDate, DenNgay: toDate, LichHoc: timeTable,
                    GioBatDau: startTime, GioKetThuc: endTime,
                    GiaoVienID: up.teacherId, PhongHoc: up.room
                }
            })

            if (up.room) {
                await tx.buoiHoc.updateMany({
                    where: { LopHocID: classId, TrangThai: 'SCHEDULED' },
                    data: { PhongHoc: up.room }
                })
            }
            return { mgs: "Succesfull" }
        })
    }

    // xóa mềm lớp học, hủy ghi danh và hủy các buổi học chưa diễn ra
    async DeleteClassByID(classId: number) {
        // nếu hủy lớp OPEN hoặc RUNNING thì hủy ghi danh: INACTIVE
        // và hủy các buổi học SCHEDULED -> CANCELLED 
        const classDB = await this.ClassIDValidator(classId)
        if (classDB.TrangThai !== 'CLOSED') {
            await this.prismaService.$transaction([
                this.prismaService.lopHoc.update({
                    where: { ID: classId },
                    data: { TrangThai: 'CLOSED' }
                }),
                this.prismaService.ghiDanh.updateMany({
                    where: { LopHocID: classId, TrangThai: 'ACTIVE' },
                    data: { TrangThai: 'INACTIVE' }
                }),
                this.prismaService.buoiHoc.updateMany({
                    where: { LopHocID: classId, TrangThai: 'SCHEDULED' },
                    data: { TrangThai: 'CANCELLED' }
                })
            ])
        }
        return { meg: "Class Closed" }
    }

    // lấy danh sách buổi học theo lớp - phần dưới
    async GetSessionsByClassId(classId: number, query: SessionStatusDTO) {
        const classDB = await this.ClassIDValidator(classId)
        return await this.sessionService.GetSessionsByClassId(classId, query)
    }

    // lấy danh sách lớp theo giáo viên - userId
    async GetClassesByTeacherId(userId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { UserID: userId }
        })
        if (!teacherDB) throw new NotFoundException('Teacher not found')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Teacher is INACTIVE')
        const classes = await this.prismaService.lopHoc.findMany({
            where: { GiaoVienID: teacherDB.ID },
            select: {
                MaLopHoc: true, khoahoc: { select: { TenKhoaHoc: true } },
                TenLop: true, MoTa: true, TuNgay: true, DenNgay: true, LichHoc: true,
                GioBatDau: true, GioKetThuc: true, SiSo: true, PhongHoc: true
            }
        })
        return classes.map(x => ({
            MaLopHoc: x.MaLopHoc, TenKhoaHoc: x.khoahoc.TenKhoaHoc,
            TenLop: x.TenLop, MoTa: x.MoTa, TuNgay: x.TuNgay,
            DenNgay: x.DenNgay, LichHoc: x.LichHoc,
            GioBatDau: x.GioBatDau, GioKetThuc: x.GioKetThuc,
            SiSo: x.SiSo, PhongHoc: x.PhongHoc
        }))
    }

    //kiểm tra id khóa học 
    private async CourseValidator(courseId: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB)// nếu không tồn tại khóa học
            throw new NotFoundException('This course is not found')
        if (courseDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Course cannot create a new class')
        return courseDB
    }

    //kiểm tra id giáo viên
    private async TeacherValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId }
        })
        if (!teacherDB)
            throw new NotFoundException('This teacher is not found')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Teacher is retire')
        return teacherDB
    }

    //kiểm tra khoảng ngày hợp lệ
    private FromDateToDateValidator(fromDate: Date, toDate: Date) {
        if (fromDate >= toDate)
            throw new ConflictException('To date must greater than from date')
    }

    private parseHHmm(time: string) {
        const [h, m] = time.split(':').map(Number);
        return { h, m };
    }

    // kiểm tra thời gian bắt đầu, kết thúc và sĩ số
    private Timetable_SizeValidator(startTime: string, endTime: string, classSize: number) {
        const { h: hStart, m: mStart } = this.parseHHmm(startTime)
        const { h: hEnd, m: mEnd } = this.parseHHmm(endTime)
        const startMinutes = hStart * 60 + mStart
        const endMinutes = hEnd * 60 + mEnd

        if (startMinutes >= endMinutes)
            throw new ConflictException('End time must greater than start time')

        if (startMinutes < 420 || startMinutes > 1260)
            throw new BadRequestException('Outside of opening hours: 7am - 9pm')

        if (classSize < 0)
            throw new ConflictException('Class size must greater than 0')
    }

    // kiểm tra trùng thời gian
    private TimeOverlap<T>(aStart: T, aEnd: T, bStart: T, bEnd: T, isTime: boolean) {
        if (isTime)
            return aStart < bEnd && bStart < aEnd
        return aStart <= bEnd && bStart <= aEnd
    }

    //kiểm tra trùng lịch học
    private HasCommonDay(aDays: number[], bDays: number[]) {
        const d = new Set(aDays)// tạo mảng d không trùng
        return bDays.some(x => d.has(x))// nếu có 1 đứa trùng trả về true
    }

    //kiểm tra giáo viên có trùng lịch dạy lớp học
    private async DuplicateClass(teacherId: number, startDate: Date, endDate: Date,
        dow: number[], sHour: string, eHour: string, room: string | null, excludeClassId?: number) {

        const where: Prisma.LopHocWhereInput = {
            GiaoVienID: teacherId,
            TrangThai: { in: ['OPEN', 'RUNNING'] }
        }
        if (excludeClassId) where.ID = { not: excludeClassId }

        const classDB = await this.prismaService.lopHoc.findMany({
            where,
            select: {
                MaLopHoc: true, TenLop: true, TuNgay: true, DenNgay: true,
                LichHoc: true, GioBatDau: true, GioKetThuc: true, PhongHoc: true
            }
        })

        for (const lh of classDB) {
            const aStart = new Date(lh.TuNgay).setHours(0, 0, 0, 0)
            const aEnd = new Date(lh.DenNgay).setHours(0, 0, 0, 0)
            const bStart = new Date(startDate).setHours(0, 0, 0, 0)
            const bEnd = new Date(endDate).setHours(0, 0, 0, 0)
            // kiểm tra khoảng ngày trùng
            const isDateOverlap = this.TimeOverlap(aStart, aEnd, bStart, bEnd, false)
            if (!isDateOverlap) continue

            // kiểm tra thứ trùng
            const isDayOverlap = this.HasCommonDay(lh.LichHoc, dow)
            if (!isDayOverlap) continue

            // kiểm tra giờ học trùng
            const isTimeOverlap = this.TimeOverlap(lh.GioBatDau, lh.GioKetThuc, sHour, eHour, true)
            if (isTimeOverlap) {
                throw new ConflictException(`Teacher schedule or room conflict with class '${lh.MaLopHoc}'`)
            }
        }
    }

    // kiểm tra đang đổi giáo viên hay thông tin lớp 
    private async ChangeTeacher(classId: number, up: UpdateClassDTO, excludeClassId?: number) {
        const classDB = await this.ClassIDValidator(classId)
        const teacher_check = up.teacherId ?? classDB.GiaoVienID
        const startDate = up.fromDate ?? classDB.TuNgay
        const endDate = up.toDate ?? classDB.DenNgay
        const timeTable = up.timeTable ?? classDB.LichHoc
        const startTime = up.startTime ?? classDB.GioBatDau
        const endTime = up.endTime ?? classDB.GioKetThuc
        const room = up.room ?? classDB.PhongHoc
        return await this.DuplicateClass(teacher_check, startDate, endDate,
            timeTable, startTime, endTime, room, excludeClassId)
    }

    // kiểm tra trùng phòng lớp
    private async HasSameRoom(room: string, fromDate: Date, toDate: Date,
        timeTable: number[], startTime: string, endTime: string, excludeClassId?: number) {
        if (!room) return
        const conflict = await this.prismaService.lopHoc.findMany({
            where: {
                PhongHoc: room,// trùng phòng
                ID: excludeClassId ? { not: excludeClassId } : undefined
            }
        })
        for (var lh of conflict) {
            const dupDate = this.TimeOverlap(fromDate, toDate, lh.TuNgay, lh.DenNgay, false)
            if (!dupDate) continue

            const dupSchedule = this.HasCommonDay(timeTable, lh.LichHoc)
            if (!dupSchedule) continue

            const dupTime = this.TimeOverlap(startTime, endTime, lh.GioBatDau, lh.GioKetThuc, true)
            if (dupTime)
                throw new BadRequestException(`${room} is used by other class `)
        }
    }
}