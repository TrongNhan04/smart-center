import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherDTO, QueryTeacherDTO, UpdateTeacherDTO } from './teacher.dto';
import * as bcrypt from 'bcrypt'
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class TeacherService {
    constructor(private prismaService: PrismaService) { }

    //kiểm tra trùng mã giáo viên
    private async TeacherCodeValidator(code: string) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { MaGiaoVien: code }
        })
        if (teacherDB) throw new BadRequestException('Teacher code was duplicate')
    }

    //kiểm tra trùng email và số điện thoại
    private async UserValidator(email: string, phone: string) {
        const user = await this.prismaService.user.findUnique({
            where: { Email: email, DienThoai: phone }
        })
        if (user) { `${email} and ${phone} are used` }
        return user
    }

    // kiểm tra giáo viên có tồn tại 
    private async TeacherIdValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId },
            include: { User: true }
        })
        if (!teacherDB) throw new BadRequestException('Teacher is not existed')
        return teacherDB
    }

    // thêm giáo viên + user
    async CreateTeacher(body: CreateTeacherDTO) {
        await this.TeacherCodeValidator(body.code)
        await this.UserValidator(body.email, body.phone)
        const hashPW = await bcrypt.hash(body.phone, 10)

        return await this.prismaService.$transaction(async (tx) => {
            // thêm user
            const newUser = await tx.user.create({
                data: {
                    HoTen: body.name.trim(),
                    Email: body.email,
                    DienThoai: body.phone,
                    MatKhauHash: hashPW,
                    VaiTro: 'TEACHER'
                }
            })
            // thêm giáo viên 
            return await tx.giaoVien.create({
                data: {
                    MaGiaoVien: body.code,
                    ChuyenMon: body.major,
                    UserID: newUser.ID
                },
                omit: {
                    CreatedAt: true,
                    UpdatedAt: true
                }
            })
        })
    }

    // lấy danh sách + tìm kiếm + lọc theo điều kiện
    async GetTeachers(query: QueryTeacherDTO) {
        const where: Prisma.GiaoVienWhereInput = {}
        const q = query.q?.trim()
        if (query.status)
            where.TrangThai = query.status
        if (q) {
            where.OR = [
                { User: { HoTen: { contains: q, mode: 'insensitive' } } },
                { MaGiaoVien: { contains: q, mode: 'insensitive' } },
                { ChuyenMon: { contains: q, mode: 'insensitive' } }
            ]
        }
        const teacherDB = await this.prismaService.giaoVien.findMany({
            where,
            include: { User: true }
        })
        return teacherDB.map(item => ({
            ID: item.ID, MaGiaoVien: item.MaGiaoVien, 
            HoTen: item.User.HoTen, ChuyenMon: item.ChuyenMon,
            TrangThai: item.TrangThai
        }))
    }

    // lấy chi tiết 1 giáo viên - phần trên
    async GetTeacherByID(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        if (teacherDB) return teacherDB
    }

    // sửa thông tin 1 giáo viên
    async UpdateTeacherByID(teacherId: number, body: UpdateTeacherDTO) {
        await this.TeacherIdValidator(teacherId)
        if (body.status === 'INACTIVE') {
            await this.DelateTeacherByID(teacherId)
            // data.TrangThai = body.status
        }

        return await this.prismaService.giaoVien.update({
            where: { ID: teacherId },
            data: {
                ChuyenMon: body.major,
                GhiChu: body.note
            },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    //xóa mềm giáo viên
    async DelateTeacherByID(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const hasClass = await this.prismaService.lopHoc.findMany({
            where: {
                GiaoVienID: teacherId,
                TrangThai: { in: ['OPEN', 'RUNNING'] }
            },
            select: { TenLop: true }
        })
        if (hasClass.length > 0)
            throw new BadRequestException(`Teacher ${teacherDB.User.HoTen} is busy with another class. Please change the teacher.`)
        return await this.prismaService.giaoVien.update({
            where: { ID: teacherId }, data: { TrangThai: 'INACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    //lấy danh sách lớp giáo viên dạy - phần dưới
    async GetClassesByTeacherID(teacherId: number) {
        await this.TeacherIdValidator(teacherId)
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { GiaoVienID: teacherId },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
        if (classDB.length == 0) return { msg: "This teacher doesn't teach any classes." }
        return classDB
    }
}
