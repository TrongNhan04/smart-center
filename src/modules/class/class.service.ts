import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassQueryDTO, ClassUpdateDTO, CreateClassDTO } from "./class.dto";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class ClassService {
    constructor(
        private prismaService: PrismaService
    ) { }

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
        if (fd >= td)
            throw new ConflictException('From date should less than today')
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
                where: { ID: classDTO.courseId },
                data: {
                    TrangThai: 'ACTIVE'
                }
            })
        ])
        return { mgs: "succesfull" }
    }

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

    async UpdateClassById(classId: number, up: ClassUpdateDTO) {
        await this.Timetable_SizeValidator(up.startTime, up.endTime, up.classSize)
        await this.FromDateToDayValidator(up.fromDate, up.toDate)

        const data: Prisma.LopHocUpdateInput = {}
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })
        if (!classDB) throw new ConflictException('Class is not existed')

        if (classDB.TrangThai === 'OPEN') {
            data.TenLop = up.name
            data.MoTa = up.description
            data.TuNgay = up.fromDate
            data.DenNgay = up.toDate
            data.LichHoc = up.timeTable
            data.GioBatDau = up.startTime
            data.GioKetThuc = up.endTime
            data.SiSo = up.classSize
            data.TrangThai = up.status
        }

        if (classDB.TrangThai === 'RUNNING') {
            data.TenLop = up.name
            data.MoTa = up.description
            if (up.status === 'CLOSED')
                data.TrangThai = up.status
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

    async GetSessionsByClassId(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId },
        })

        if (!classDB) throw new BadRequestException('Class is not existed')
        if (classDB.TrangThai === 'CLOSED')
            throw new BadRequestException(`Class ${classDB.TenLop} is closed`)

        return await this.prismaService.buoiHoc.findMany({
            where: {LopHocID: classId},
            omit:{
                ID: true,
                CreatedAt: true,
                updatedAt: true
            }
        })
    }
}