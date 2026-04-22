import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CourseQueryDTO, CreateCourseDTO, CourseUpdateDTO } from "./course.dto";
import { Prisma } from "src/generated/prisma/client";

@Injectable()
export class CourseService {
    constructor(private prismaSv: PrismaService) { }
    // tạo khóa học
    async create(body: CreateCourseDTO) {
        const courseDB = await this.prismaSv.khoaHoc.findUnique({
            where: { MaKhoaHoc: body.code }
        })
        if (courseDB)
            throw new ConflictException('Mã khóa học đã tồn tại!')

        return await this.prismaSv.khoaHoc.create({
            data: {
                MaKhoaHoc: body.code,
                TenKhoaHoc: body.name,
                TrinhDo: body.level,
                ThoiGian: body.duration,
                HocPhi: body.courseFee,
                TongSoBuoi: body.totalSession,
                MoTa: body.description,
                decuong: {
                    create: body.syllabus.map(item => ({
                        ThuTu: item.ThuTu,
                        ChuDe: item.ChuDe
                    })).slice(0, body.totalSession)
                }
            }
        })
    }

    // lấy danh sách khóa học
    async getMany(query: CourseQueryDTO) {
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
            include: {
                decuong: {
                    select: { ThuTu: true, ChuDe: true }
                }
            },
            omit: { CreatedAt: true, UpdatedAt: true },
            orderBy: { ID: 'desc' }
        })
    }

    async getManyForCmb() {
        return await this.prismaSv.khoaHoc.findMany({
            where: { TrangThai: { not: 'INACTIVE' } },
            select: {
                ID: true, MaKhoaHoc: true, TenKhoaHoc: true,
                ThoiGian: true, HocPhi: true
            },
            orderBy: { MaKhoaHoc: 'asc' }
        })
    }

    // lấy chi tiết 1 khóa học
    async getOne(id: number) {
        const courseDB = await this.idValidator(id)
        const syllabusDB = await this.prismaSv.deCuong.findMany({
            where: { KhoaHocID: courseDB.ID },
            omit: { KhoaHocID: true }
        })
        // dùng decuong để khớp với hàm khác có include decuong
        return { ...courseDB, decuong: syllabusDB }
    }

    // cập nhật khóa học theo trạng thái
    async updateById(courseId: number, body: CourseUpdateDTO) {
        const courseDB = await this.idValidator(courseId)

        if (courseDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Không thể cập nhật khóa học')

        //tạo data cho update
        const updateData: Prisma.KhoaHocUpdateInput = {
            TenKhoaHoc: body.name ?? courseDB.TenKhoaHoc,
            TrinhDo: body.level ?? courseDB.TrinhDo,
            TongSoBuoi: body.totalSession ?? courseDB.TongSoBuoi,
            ThoiGian: body.duration ?? courseDB.ThoiGian,
            HocPhi: body.courseFee ?? courseDB.HocPhi,
            MoTa: body.description ?? courseDB.MoTa,
        }
        if (body.syllabus) {
            updateData.decuong = {
                deleteMany: {}, // xóa hết cái cũ
                // tạo cái mới
                create: body.syllabus.map(item => ({
                    ThuTu: item.ThuTu,
                    ChuDe: item.ChuDe
                }))
            }
        }

        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseId },
            data: updateData,
            select: { ID: true }
        })
    }

    // xóa mềm khóa học
    async deleteById(courseId: number) {
        const courseDB = await this.idValidator(courseId)
        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseDB.ID },
            data: { TrangThai: 'INACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // khôi phục khóa học
    async restore(courseId: number) {
        const courseDB = await this.idValidator(courseId)
        return await this.prismaSv.khoaHoc.update({
            where: { ID: courseDB.ID, TrangThai: 'INACTIVE' },
            data: { TrangThai: 'ACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // lấy danh sách lớp học của khóa học
    async getClassesById(courseId: number) {
        const courseDB = await this.idValidator(courseId)
        const classDB = await this.prismaSv.lopHoc.findMany({
            where: { KhoaHocID: courseDB.ID },
            include: {
                giaovien: { select: { User: { select: { HoTen: true } } } },
                _count: { select: { ghidanh: { where: { TrangThai: 'ACTIVE' } } } }
            },
            omit:{CreatedAt:true, UpdatedAt:true, KhoaHocID:true},
            orderBy: { ID: 'desc' }
        })
        return classDB.map(lh => {
            const { giaovien, _count, GioBatDau, GioKetThuc, ...rest } = lh
            return {
                ...rest,
                GiaoVien: giaovien.User.HoTen,
                GioHoc: GioBatDau + ' - ' + GioKetThuc,
                TongGhiDanh: _count.ghidanh
            }
        })
    }

    //kiểm tra id khóa học
    private async idValidator(courseId: number) {
        const courseDB = await this.prismaSv.khoaHoc.findUnique({
            where: { ID: courseId },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
        if (!courseDB) throw new NotFoundException('Không tìm thấy khóa học')
        return courseDB
    }
}