import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CoursesDTO, CreateCourseDTO, UpdateCourseDTO } from "./dto/course.dto";
import { Prisma } from "src/generated/prisma/client";
import { constants } from "buffer";

@Injectable()
export class CourseService {
    constructor(
        private prismaService: PrismaService
    ) { }

    async ValidateCourse(courseCode: string) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { MaKhoaHoc: courseCode }
        })

        if (!courseDB)
            return courseDB
        throw new ConflictException('Course code is existed!')
    }

    async CreateCourse(courseDTO: CreateCourseDTO) {
        // kiểm tra trùng mã khóa học
        const courseDB = await this.ValidateCourse(courseDTO.code)

        const name = courseDTO.name.trim()
        const level = courseDTO.level.trim()

        const newCourse = await this.prismaService.khoaHoc.create({
            data: {
                MaKhoaHoc: courseDTO.code,
                TenKhoaHoc: name,
                TrinhDo: level,
                ThoiGian: courseDTO.duration,
                HocPhi: courseDTO.courseFee,
                TongSoBuoi: courseDTO.totalSession,
            },
            omit: { // bỏ những trường nào
                ID: true,
                CreatedAt: true,
                UpdatedAt: true
            }
        })
        return newCourse
    }

    async GetCourses(query: CoursesDTO) {
        // tạo điều kiện lọc
        const where: Prisma.KhoaHocWhereInput = {};
        const q = query.q?.trim()
        if (query.status) // nếu có status thì where status
            where.TrangThai = query.status
        else// nếu không có thì theo các trạng thái dướinp
            where.TrangThai = { in: ['ACTIVE', 'DRAFT'] }
        if (q) { // nếu có query thì where theo tên hoặc mã 
            where.OR = [
                // mã khóa học chứa q và không phân biệt hoa thường
                { MaKhoaHoc: { contains: q, mode: 'insensitive' } },
                { TenKhoaHoc: { contains: q, mode: 'insensitive' } }
            ]
        }

        // tìm theo bộ lọc ở trên
        const courses = this.prismaService.khoaHoc.findMany({
            where,
            omit: {
                CreatedAt: true,
                UpdatedAt: true
            }
        })
        return courses
    }

    async GetCourseById(id: number) {
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: id }
        })
        return courseDB
    }

    async UpdateCourseById(id: number, courseUpdate: UpdateCourseDTO) {
        // update theo trạng thái
        const courseDB = await this.prismaService.khoaHoc.findUnique({
            where: { ID: id }
        })
        if (!courseDB)
            throw new ConflictException('Course is not exist!')
        if (courseDB.TrangThai === 'DRAFT') {
        const update =  await this.prismaService.khoaHoc.update({
                where: { ID: id },
                data:{
                    TenKhoaHoc: courseUpdate.name,
                    TrinhDo: courseUpdate.level,
                    TongSoBuoi: courseUpdate.totalSession,
                    ThoiGian: courseUpdate.duration,
                    HocPhi: courseUpdate.courseFee,
                    MoTa: courseUpdate.description
                }
            })
        return update
        }
    }
}