import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CourseQueryDTO, CreateCourseDTO, CourseUpdateDTO } from "./course.dto";
import { Prisma } from "src/generated/prisma/client";
import { ClassService } from "../class/class.service";

@Injectable()
export class CourseService {
    constructor(
        private prismaService: PrismaService,
        private classService: ClassService
    ) { }

    // tạo khóa học
    async CreateCourse(courseDTO: CreateCourseDTO) {
        // kiểm tra trùng mã khóa học
        await this.ValidateCourse(courseDTO.code)

        const name = courseDTO.name.trim()
        const level = courseDTO.level.trim()

        return await this.prismaService.khoaHoc.create({
            data: {
                MaKhoaHoc: courseDTO.code,
                TenKhoaHoc: name,
                TrinhDo: level,
                ThoiGian: courseDTO.duration,
                HocPhi: courseDTO.courseFee,
                TongSoBuoi: courseDTO.totalSession,
                MoTa: courseDTO.description
            },
            omit: { // bỏ những trường nào
                CreatedAt: true,
                UpdatedAt: true
            }
        })
    }

    // lấy danh sách khóa học
    async GetCourses(query: CourseQueryDTO) {
        // tạo điều kiện where
        const where: Prisma.KhoaHocWhereInput = {};
        const q = query.q?.trim()
        if (query.status) // nếu có status thì where status
            where.TrangThai = query.status
        if (q) { // nếu có query thì where status, tên hoặc mã 
            where.OR = [
                // mã khóa học chứa q và không phân biệt hoa thường
                { MaKhoaHoc: { contains: q, mode: 'insensitive' } },
                { TenKhoaHoc: { contains: q, mode: 'insensitive' } }
            ]
        }
        // tìm theo bộ lọc ở trên
        return await this.prismaService.khoaHoc.findMany({
            where,
            omit: {
                CreatedAt: true,
                UpdatedAt: true
            },
            orderBy: { ID: 'desc' }
        })
    }

    // lấy chi tiết 1 khóa học
    async GetCourseById(id: number) {
        return await this.CourseIdValidator(id)
    }

    // cập nhật khóa học theo trạng thái
    async UpdateCourseById(courseId: number, courseUpdate: CourseUpdateDTO) {
        const courseDB = await this.CourseIdValidator(courseId)
        //tạo data cho update
        const data: Prisma.KhoaHocUpdateInput = {}

        if (courseDB.TrangThai !== 'INACTIVE') {
            data.TenKhoaHoc = courseUpdate.name
            data.TrinhDo = courseUpdate.level
            data.TongSoBuoi = courseUpdate.totalSession
            data.ThoiGian = courseUpdate.duration
            data.HocPhi = courseUpdate.courseFee
            data.MoTa = courseUpdate.description
        }

        return await this.prismaService.khoaHoc.update({
            where: { ID: courseId },
            data,
            select:{ID:true}
        })
    }

    // xóa mềm khóa học
    async DeleteCouresByID(courseId: number) {
        const courseDB = await this.CourseIdValidator(courseId)
        return await this.prismaService.khoaHoc.update({
            where: { ID: courseDB.ID },
            data: { TrangThai: 'INACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // khôi phục khóa học
    async RestoreCourseById(courseId: number) {
        const courseDB = await this.CourseIdValidator(courseId)
        return await this.prismaService.khoaHoc.update({
            where: { ID: courseDB.ID, TrangThai:'INACTIVE' },
            data: { TrangThai: 'ACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // lấy danh sách lớp học của khóa học
    async GetClassesByCourseId(courseId: number) {
        await this.CourseIdValidator(courseId)
        return await this.classService.GetClassesByCourseId(courseId)
    }

    //kiểm tra id khóa học
    private async CourseIdValidator(courseId: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB) throw new NotFoundException('Course not found')
        return courseDB
    }

    // kiểm tra trùng mã khóa học
    private async ValidateCourse(courseCode: string) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { MaKhoaHoc: courseCode }
        })
        if (courseDB)
            throw new ConflictException('Mã khóa học đã tồn tại!')
        return courseDB
    }
}