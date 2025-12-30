import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CoursesDTO, CreateCourseDTO, UpdateCourseDTO } from "./course.dto";
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
        if (courseDB)
            throw new ConflictException('Course code is existed!')
    }

    async CreateCourse(courseDTO: CreateCourseDTO) {
        // kiểm tra trùng mã khóa học
        await this.ValidateCourse(courseDTO.code)

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
        // tạo điều kiện where
        const where: Prisma.KhoaHocWhereInput = {};
        const q = query.q?.trim()
        if (query.status) // nếu có status thì where status
            where.TrangThai = query.status
        else// nếu không có thì theo các trạng thái dưới
            where.TrangThai = { in: ['ACTIVE', 'DRAFT'] }
        if (q) { // nếu có query thì where status, tên hoặc mã 
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
            where: { ID: id },
            omit: {
                CreatedAt: true,
                UpdatedAt: true
            }
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

        //tạo data cho update
        const data: Prisma.KhoaHocUpdateInput = {}

        // data update cho DRAFT
        if(courseDB.TrangThai === 'DRAFT'){
            data.TenKhoaHoc = courseUpdate.name,
            data.TrinhDo = courseUpdate.level,
            data.TongSoBuoi = courseUpdate.totalSession,
            data.ThoiGian = courseUpdate.duration,
            data.HocPhi = courseUpdate.courseFee,
            data.MoTa = courseUpdate.description
            data.TrangThai = courseUpdate.status
        }

        //data update cho ACTIVE
        if(courseDB.TrangThai === 'ACTIVE'){
            data.TenKhoaHoc = courseUpdate.name,
            data.MoTa = courseUpdate.description
            if(courseUpdate.status === 'INACTIVE')
                data.TrangThai = courseUpdate.status
            else throw new BadRequestException('ACTIVE allows to INACTIVE')
        }
        
        //data update cho INACTIVE
        if(courseDB.TrangThai === 'INACTIVE'){
            if(courseUpdate.status === 'ACTIVE')
                data.TrangThai = 'ACTIVE'
            else
                throw new BadRequestException('INACTIVE allows to ACTIVE')
        }
            
        return this.prismaService.khoaHoc.update({
            where:{ID:id},
            data,
            omit: {CreatedAt:true, UpdatedAt: true}
        })
    }

    async DeleteCouresByID(id: number){
        return await this.prismaService.khoaHoc.update({
            where: {ID: id},
            data: {TrangThai: 'INACTIVE'},
            omit:{CreatedAt:true, UpdatedAt: true}
        })
    }
}