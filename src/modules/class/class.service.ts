import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassQueryDTO, CreateClassDTO } from "./class.dto";
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

    //kiểm tra khóa học 
    async CourseValidator(courseId: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB)// nếu không tồn tại khóa học
            throw new ConflictException('This course is not found')
        if (courseDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Course cannot create a new class')
    }

    //kiểm tra giáo viên
    async TeacherValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId }
        })
        if (teacherDB == null)
            throw new ConflictException('This teacher is not found')
        if (teacherDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Teacher is retire')
    }

    async CreateClass(classDTO: CreateClassDTO) {

        await this.ClassValidator(classDTO.code)
        await this.CourseValidator(classDTO.courseId)
        await this.TeacherValidator(classDTO.teacherId)

        // tách giờ bởi dấu ":" và chuyển thành số 
        const startTimeSplit = classDTO.startTime.split(":").map(Number)
        // tổng số phút = giờ * 60 + phút --> để so sánh
        const startMinutes = startTimeSplit[0] * 60 + startTimeSplit[1]

        const endTimeSplit = classDTO.endTime.split(":").map(Number)
        const endMinutes = endTimeSplit[0] * 60 + endTimeSplit[1]

        if (startMinutes > endMinutes)
            throw new ConflictException('End time must greater than start time')

        if (classDTO.classSize < 0)
            throw new ConflictException('Class size must greater than 0')
        await this.prismaService.$transaction([
            this.prismaService.lopHoc.create({
                data: {
                    MaLopHoc: classDTO.code,
                    TenLop: classDTO.name,
                    KhoaHocID: classDTO.courseId,
                    GiaoVienID: classDTO.teacherId,
                    TuNgay: classDTO.fromDay,
                    DenNgay: classDTO.toDay,
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
                {TenLop: {contains:q, mode:'insensitive'}},
                // theo tên giáo viên từ bảng giáo viên
                {giaovien: {HoTen: {contains:q, mode:'insensitive'}} }
            ]
        }
        return await this.prismaService.lopHoc.findMany({
            where,
            omit:{
                ID:true,
                CreatedAt:true,
                updatedAt: true,
            }
        })
    }
}