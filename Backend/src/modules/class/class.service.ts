import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryClassDTO, UpdateClassDTO, CreateClassDTO } from "./class.dto";
import { Prisma } from "src/generated/prisma/client";
import { DateHelper } from "src/common/date.helper";
import { LopHocWhereInput, LopHocWhereUniqueInput } from "src/generated/prisma/models";

@Injectable()
export class ClassService {
    constructor(private prismaService: PrismaService) { }

    // thêm lớp mới
    async CreateClass(classDTO: CreateClassDTO) {
        await Promise.all([
            this.ClassValidator(classDTO.code),
            this.CourseValidator(classDTO.courseId),
            this.TeacherValidator(classDTO.teacherId),
            this.DuplicateClass(classDTO.teacherId, classDTO.fromDate,
                classDTO.toDate, classDTO.timeTable, classDTO.startTime,
                classDTO.endTime),
            this.HasSameRoom(classDTO)
        ])
        DateHelper.ValidateTimeRange(classDTO.startTime, classDTO.endTime)
        DateHelper.FromDateToDateValidator(classDTO.fromDate, classDTO.toDate)
        const toDate = new Date(classDTO.toDate)
        toDate.setDate(toDate.getDate() + 1)

        return await this.prismaService.$transaction(async (tx) => {
            const newClass = await tx.lopHoc.create({
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
                    PhongHoc: classDTO.room
                }
            })
            tx.khoaHoc.updateMany({
                where: { ID: classDTO.courseId, TrangThai: 'DRAFT' },
                data: { TrangThai: 'ACTIVE' }
            })
            return newClass
        })
    }

    // lấy danh sách lớp mặc định hoặc query
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
                    { giaovien: { User: { HoTen: { contains: q, mode: 'insensitive' } } } }
                ]
            })
        }
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { AND: condition },
            include: {
                khoahoc: true, giaovien: { include: { User: true } },
                _count: {
                    select: {
                        ghidanh: { where: { TrangThai: 'ACTIVE' } },
                        buoihoc: { where: { TrangThai: 'COMPLETED' } }
                    }
                }
            },
            orderBy: { ID: 'desc' }
        })

        return classDB.map(lh => {
            let status: string | null = null
            if (lh.khoahoc.TongSoBuoi == lh._count.buoihoc)
                status = 'FINISHED'

            return {
                ID: lh.ID, MaLopHoc: lh.MaLopHoc, TenLop: lh.TenLop,
                GiaoVien: {
                    ID: lh.GiaoVienID,
                    HoTen: lh.giaovien.User.HoTen
                },
                KhoaHoc: {
                    ID: lh.KhoaHocID,
                    TenKhoaHoc: lh.khoahoc.TenKhoaHoc,
                },
                TuNgay: lh.TuNgay, DenNgay: lh.DenNgay,
                LichHoc: lh.LichHoc, MoTa: lh.MoTa, PhongHoc: lh.PhongHoc,
                GioHoc: lh.GioBatDau + ' - ' + lh.GioKetThuc, SiSo: lh.SiSo,
                TrangThai: status || lh.TrangThai, TongGhiDanh: lh._count.ghidanh,
            }
        })
    }

    // lấy danh sách lớp cho combobox
    async GetDataForCmb() {
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { TrangThai: { not: 'CLOSED' } },
            select: {
                ID: true, TenLop: true, MaLopHoc: true,
                LichHoc: true, GioBatDau: true, GioKetThuc: true, SiSo: true,
                khoahoc: { select: { HocPhi: true } },
                _count: { select: { ghidanh: { where: { TrangThai: 'ACTIVE' } } } }
            },
            orderBy: { MaLopHoc: 'asc' }
        })
        return classDB.map(m => ({
            ID: m.ID, TenLop: m.TenLop, MaLopHoc: m.MaLopHoc,
            LichHoc: m.LichHoc, HocPhi: m.khoahoc.HocPhi,
            GioHoc: m.GioBatDau + " - " + m.GioKetThuc,
            TongGhiDanh: m._count.ghidanh, SiSo: m.SiSo
        }))
    }

    // lấy chi tiết lớp - phần trên
    async GetClassById(classId: number, userId: number | null) {
        const where: LopHocWhereUniqueInput = { ID: classId }
        if (userId) // có giáo viên thì lấy lớp giáo viên
            where.giaovien = { UserID: userId }

        const classDB = await this.prismaService.lopHoc.findUnique({
            where: where,
            include: {
                khoahoc: true, giaovien: { include: { User: true } },
                _count: {
                    select: {
                        ghidanh: { where: { TrangThai: 'ACTIVE' } },
                        buoihoc: { where: { TrangThai: 'COMPLETED' } }
                    }
                }
            }
        })
        if (!classDB) throw new ForbiddenException('Không tìm thấy lớp học hoặc truy cập bị từ chối')
        let status: string | null = null
        if (classDB.khoahoc.TongSoBuoi == classDB._count.buoihoc)
            status = 'FINISHED'
        return {
            ID: classDB.ID, MaLopHoc: classDB.MaLopHoc, TenLop: classDB.TenLop,
            GiaoVien: {
                ID: classDB.GiaoVienID,
                HoTen: classDB.giaovien.User.HoTen
            },
            KhoaHoc: {
                ID: classDB.KhoaHocID,
                TenKhoaHoc: classDB.khoahoc.TenKhoaHoc
            },
            PhongHoc: classDB.PhongHoc, KhoaHocID: classDB.KhoaHocID,
            TuNgay: classDB.TuNgay, DenNgay: classDB.DenNgay,
            LichHoc: classDB.LichHoc, MoTa: classDB.MoTa,
            GioHoc: classDB.GioBatDau + ' - ' + classDB.GioKetThuc, SiSo: classDB.SiSo,
            TrangThai: status || classDB.TrangThai, TongGhiDanh: classDB._count.ghidanh,
        }
    }

    // lấy danh sách lớp theo id khóa học
    async GetClassesByCourseId(courseId: number) {
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { KhoaHocID: courseId },
            include: {
                giaovien: { include: { User: true } },
                _count: { select: { ghidanh: { where: { TrangThai: 'ACTIVE' } } } }
            },
            orderBy: { ID: 'desc' }
        })
        return classDB.map(lh => ({
            ID: lh.ID, MaLopHoc: lh.MaLopHoc, TenLop: lh.TenLop,
            GiaoVien: {
                ID: lh.GiaoVienID,
                HoTen: lh.giaovien.User.HoTen
            },
            PhongHoc: lh.PhongHoc, KhoaHocID: lh.KhoaHocID,
            TuNgay: lh.TuNgay, DenNgay: lh.DenNgay, LichHoc: lh.LichHoc,
            GioHoc: lh.GioBatDau + ' - ' + lh.GioKetThuc, SiSo: lh.SiSo,
            TrangThai: lh.TrangThai, TongGhiDanh: lh._count.ghidanh
        }))
    }

    // cập nhật lớp theo trạng thái
    async UpdateClassById(classId: number, up: UpdateClassDTO) {
        const classDB = await this.ClassIDValidator(classId)
        // đếm buổi học của lớp
        const countSession = await this.prismaService.buoiHoc.count({
            where: { LopHocID: classId, TrangThai: { not: 'CANCELLED' } }
        })

        // Lớp RUNNING || OPEN có buổi học
        if (classDB.TrangThai === 'RUNNING' || (classDB.TrangThai === 'OPEN' && countSession > 0)) {
            if (up.fromDate || up.toDate || up.timeTable)
                throw new BadRequestException('Không được thay đổi thông tin ảnh hưởng đến lịch học')
            if (up.startTime || up.endTime) {
                throw new BadRequestException('Không được thay đổi thông tin ảnh hưởng đến lịch học')
            }
        }

        const name = up.name ?? classDB.TenLop
        const description = up.description ?? classDB.MoTa
        const size = up.classSize ?? classDB.SiSo

        const fromDate = up.fromDate ?? classDB.TuNgay
        const toDate = up.toDate ?? classDB.DenNgay
        const timeTable = up.timeTable ?? classDB.LichHoc
        const startTime = up.startTime ?? classDB.GioBatDau
        const endTime = up.endTime ?? classDB.GioKetThuc

        // nếu đổi giáo viên thì kiểm tra gv có rảnh không
        if (up.teacherId) await this.ChangeTeacher(classId, up, classId)

        // nếu đổi phòng thì kiểm tra phòng có trống không
        if (up.room) await this.HasSameRoom(up, classDB.ID)

        DateHelper.FromDateToDateValidator(fromDate, toDate)
        DateHelper.ValidateTimeRange(startTime, endTime)

        return await this.prismaService.$transaction(async (tx) => {
            if (up.room) {
                await tx.buoiHoc.updateMany({
                    where: { LopHocID: classId, TrangThai: 'SCHEDULED' },
                    data: { PhongHoc: up.room }
                })
            }

            await tx.lopHoc.update({
                where: { ID: classId },
                data: {
                    TenLop: name, MoTa: description, SiSo: size,
                    TuNgay: fromDate, DenNgay: toDate, LichHoc: timeTable,
                    GioBatDau: startTime, GioKetThuc: endTime,
                    GiaoVienID: up.teacherId, PhongHoc: up.room
                }
            })

            return { ID: classId }
        })
    }

    // xóa mềm lớp học, hủy ghi danh và hủy các buổi học chưa diễn ra
    async DeleteClassByID(classId: number) {
        const classDB = await this.ClassIDValidator(classId)
        if (classDB.TrangThai !== 'OPEN')
            throw new BadRequestException('Không thể hủy lớp học này!')

        await this.prismaService.$transaction(async tx => {
            const now = new Date()
            await tx.lopHoc.update({
                where: { ID: classId },
                data: { TrangThai: 'CLOSED' }
            })
            await tx.ghiDanh.updateMany({
                where: { LopHocID: classId, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            })
            await tx.buoiHoc.updateMany({
                where: {
                    LopHocID: classId,
                    TrangThai: 'SCHEDULED',
                    // BatDauLuc: { gt: now }
                },
                data: { TrangThai: 'CANCELLED' }
            })
        })
        return { msg: "Hủy lớp học thành công" }
    }

    // lấy danh sách lớp theo giáo viên - userId
    async GetClassesByUserId(userId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { UserID: userId }
        })
        if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Giáo viên đã nghỉ')
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { GiaoVienID: teacherDB.ID },
            include: {
                khoahoc: true,
                _count: {
                    select:
                    {
                        ghidanh: { where: { TrangThai: 'ACTIVE' } },
                        buoihoc: { where: { TrangThai: 'COMPLETED' } }
                    }
                }
            }
        })
        if (classDB.length == 0) return []
        return classDB.map(lh => ({
            ID: lh.ID, MaLopHoc: lh.MaLopHoc, TenLop: lh.TenLop,
            PhongHoc: lh.PhongHoc, LichHoc: lh.LichHoc,
            TuNgay: lh.TuNgay,
            GioHoc: lh.GioBatDau + ' - ' + lh.GioKetThuc,
            TrangThai: lh.TrangThai, TongGhiDanh: lh._count.ghidanh,
            TongSoBuoi: lh.khoahoc.TongSoBuoi, BuoiDaHoc: lh._count.buoihoc
        }))
    }

    //kiểm tra trùng mã lớp 
    private async ClassValidator(code: string) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { MaLopHoc: code }
        })
        if (classDB)
            throw new ConflictException('Mã lớp đã được sử dụng')
        return classDB
    }

    // kiểm tra id lớp
    private async ClassIDValidator(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
        return classDB
    }

    //kiểm tra id khóa học 
    private async CourseValidator(courseId: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB)// nếu không tồn tại khóa học
            throw new NotFoundException('Không tìm thấy khóa học')
        if (courseDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Khóa học này tạm thời không thể mở lớp')
        return courseDB
    }

    //kiểm tra id giáo viên
    private async TeacherValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId }
        })
        if (!teacherDB)
            throw new NotFoundException('Không tìm thấy giáo viên')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Giáo viên đã nghỉ')
        return teacherDB
    }

    //kiểm tra trùng lịch học
    private HasCommonDay(aDays: number[], bDays: number[]) {
        const d = new Set(aDays)// tạo mảng d không trùng
        return bDays.some(x => d.has(x))// nếu có 1 đứa trùng trả về true
    }

    //kiểm tra giáo viên có trùng lịch dạy lớp học
    private async DuplicateClass(teacherId: number, startDate: Date, endDate: Date,
        dow: number[], sHour: string, eHour: string, excludeClassId?: number) {
        const teacherDB = await this.TeacherValidator(teacherId)
        const where: Prisma.LopHocWhereInput = {
            GiaoVienID: teacherDB.ID,
            TrangThai: { in: ['OPEN', 'RUNNING'] }
        }
        if (excludeClassId) where.ID = { not: excludeClassId }
        // giả sử giáo viên A đang dạy lớp A
        const classDB = await this.prismaService.lopHoc.findMany({
            where, // tìm lớp khác lớp A mà giáo viên A dạy
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
            const isDateOverlap = DateHelper.TimeOverlap(aStart, aEnd, bStart, bEnd, false)
            if (!isDateOverlap) continue

            // kiểm tra thứ trùng
            const isDayOverlap = this.HasCommonDay(lh.LichHoc, dow)
            if (!isDayOverlap) continue

            // kiểm tra giờ học trùng
            const isTimeOverlap = DateHelper.TimeOverlap(lh.GioBatDau, lh.GioKetThuc, sHour, eHour, true)
            if (isTimeOverlap) {
                throw new ConflictException
                    (`Giáo viên trùng lịch dạy với lớp ${lh.TenLop} - ${lh.MaLopHoc}`)
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
        return await this.DuplicateClass(teacher_check, startDate, endDate,
            timeTable, startTime, endTime, excludeClassId)
    }

    // kiểm tra trùng phòng lớp
    private async HasSameRoom(body: UpdateClassDTO | CreateClassDTO, 
        excludeClassId?: number) {
        if (!body.room) return
        const conflict = await this.prismaService.lopHoc.findMany({
            where: {
                PhongHoc: body.room,// trùng phòng
                ID: excludeClassId ? { not: excludeClassId } : undefined
            }
        })
        for (var lh of conflict) {
            const dupDate = DateHelper.TimeOverlap(body.fromDate,
                body.toDate, lh.TuNgay, lh.DenNgay, false)
            if (!dupDate) continue

            const dupSchedule = this.HasCommonDay(body.timeTable!, lh.LichHoc)
            if (!dupSchedule) continue

            const dupTime = DateHelper.TimeOverlap(body.startTime,
                body.endTime, lh.GioBatDau, lh.GioKetThuc, true)
            if (dupTime)
                throw new BadRequestException(`${body.room} đã được sử dụng bởi lớp ${lh.TenLop} - ${lh.MaLopHoc} `)
        }
    }
}