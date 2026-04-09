import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CourseQueryDTO, CreateCourseDTO, CourseUpdateDTO } from "./course.dto";
import { Prisma } from "src/generated/prisma/client";
import { DeCuongCreateManyInput, DeCuongCreateManyKhoahocInput } from "src/generated/prisma/models";

@Injectable()
export class CourseService {
    constructor(private prismaSv: PrismaService) { }
    // tạo khóa học
    async CreateCourse(courseDTO: CreateCourseDTO) {
        const courseDB = await this.prismaSv.khoaHoc.findUnique({
            where: { MaKhoaHoc: courseDTO.code }
        })
        if (courseDB)
            throw new ConflictException('Mã khóa học đã tồn tại!')

        const name = courseDTO.name.trim()
        const level = courseDTO.level.trim()

        return await this.prismaSv.$transaction(async (tx) => {
            const newCourse = await tx.khoaHoc.create({
                data: {
                    MaKhoaHoc: courseDTO.code,
                    TenKhoaHoc: name,
                    TrinhDo: level,
                    ThoiGian: courseDTO.duration,
                    HocPhi: courseDTO.courseFee,
                    TongSoBuoi: courseDTO.totalSession,
                    MoTa: courseDTO.description
                },
            })
            const data: DeCuongCreateManyInput[] = courseDTO.syllabus.map(
                item => ({
                    KhoaHocID: newCourse.ID,
                    ThuTu: item.ThuTu,
                    ChuDe: item.ChuDe
                })
            ).splice(0,newCourse.TongSoBuoi)
            await tx.deCuong.createMany({
                data: data
            })
            return {ID: newCourse.ID}
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
        return await this.prismaSv.khoaHoc.findMany({
            where,
            omit: {
                CreatedAt: true,
                UpdatedAt: true
            },
            orderBy: { ID: 'desc' }
        })
    }

    async GetDataForCmb() {
        return await this.prismaSv.khoaHoc.findMany({
            where: { TrangThai: { not: 'INACTIVE' } },
            select: {
                ID: true,
                MaKhoaHoc: true,
                TenKhoaHoc: true,
                ThoiGian: true,
                HocPhi: true
            },
            orderBy: { MaKhoaHoc: 'asc' }
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

        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseId },
            data,
            select: { ID: true }
        })
    }

    // xóa mềm khóa học
    async DeleteCouresByID(courseId: number) {
        const courseDB = await this.CourseIdValidator(courseId)
        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseDB.ID },
            data: { TrangThai: 'INACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // khôi phục khóa học
    async RestoreCourseById(courseId: number) {
        const courseDB = await this.CourseIdValidator(courseId)
        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseDB.ID, TrangThai: 'INACTIVE' },
            data: { TrangThai: 'ACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // lấy danh sách lớp học của khóa học
    async GetClassesByCourseId(courseId: number) {
        const courseDB = await this.CourseIdValidator(courseId)
        const classDB = await this.prismaSv.lopHoc.findMany({
            where: { KhoaHocID: courseDB.ID },
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

    //kiểm tra id khóa học
    private async CourseIdValidator(courseId: number) {
        const courseDB = await this.prismaSv.khoaHoc.findUnique({
            where: { ID: courseId }
        })
        if (!courseDB) throw new NotFoundException('Không tìm thấy khóa học')
        return courseDB
    }
}