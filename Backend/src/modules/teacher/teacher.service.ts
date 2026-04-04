import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
        if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
        return teacherDB
    }

    // thêm giáo viên + user
    async CreateTeacher(body: CreateTeacherDTO) {
        await Promise.all([
            this.TeacherCodeValidator(body.code),
            this.UserValidator(body.email, body.phone)
        ])
        const hashPW = await bcrypt.hash(body.phone, 15)

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
            const newTeacher = await tx.giaoVien.create({
                data: {
                    MaGiaoVien: body.code,
                    NgaySinh: body.dob,
                    ChuyenMon: body.major,
                    DiaChi: body.address ? body.address : null,
                    UserID: newUser.ID
                },
                include: { User: true }
            })
            return {
                ID: newTeacher.ID,
                MaGiaoVien: newTeacher.MaGiaoVien,
                HoTen: newTeacher.User.HoTen,
                DienThoai: newTeacher.User.DienThoai,
                Email: newTeacher.User.Email,
                ChuyenMon: newTeacher.ChuyenMon,
                TrangThai: newTeacher.TrangThai
            }
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
            include: { User: true }, orderBy: { CreatedAt: 'desc' }
        })
        return teacherDB.map(item => ({
            ID: item.ID,
            MaGiaoVien: item.MaGiaoVien,
            HoTen: item.User.HoTen,
            NgaySinh: item.NgaySinh,
            DiaChi: item.DiaChi,
            Email: item.User.Email,
            DienThoai: item.User.DienThoai,
            ChuyenMon: item.ChuyenMon,
            TrangThai: item.TrangThai
        }))
    }

    // lấy danh sách giáo viên cho combobox
    async GetDataForCmb() {
        const teacherDB = await this.prismaService.giaoVien.findMany({
            where: { TrangThai: 'ACTIVE' },
            select: {
                ID: true,
                MaGiaoVien: true,
                User: { select: { HoTen: true } }
            },
            orderBy: { MaGiaoVien: 'asc' }
        })
        return teacherDB.map(m => ({
            ID: m.ID,
            MaGiaoVien: m.MaGiaoVien,
            HoTen: m.User.HoTen
        }))
    }

    // lấy chi tiết 1 giáo viên - phần trên
    async GetTeacherByID(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const total = await this.prismaService.buoiHoc.count({
            where: {
                lophoc: { GiaoVienID: teacherDB.ID },
                TrangThai: 'COMPLETED'
            }
        })
        return {
            ID: teacherDB.ID,
            MaGiaoVien: teacherDB.MaGiaoVien,
            HoTen: teacherDB.User.HoTen,
            NgaySinh: teacherDB.NgaySinh,
            Email: teacherDB.User.Email,
            DienThoai: teacherDB.User.DienThoai,
            DiaChi: teacherDB.DiaChi,
            ChuyenMon: teacherDB.ChuyenMon,
            TrangThai: teacherDB.TrangThai,
            SoBuoiDaDay: total
        }
    }

    // sửa thông tin 1 giáo viên
    async UpdateTeacherByID(teacherId: number, body: UpdateTeacherDTO) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: teacherDB.UserID }
        })
        if (!userDB) throw new NotFoundException('Không tìm thấy người dùng')

        const name = body.name ?? userDB.HoTen
        const major = body.major ?? teacherDB.ChuyenMon
        const address = body.address ?? teacherDB.DiaChi
        const dob = body.dob ?? teacherDB.NgaySinh
        await this.prismaService.$transaction([
            this.prismaService.giaoVien.update({
                where: { ID: teacherDB.ID },
                data: {
                    ChuyenMon: major,
                    DiaChi:address,
                    NgaySinh: dob
                }
            }),
            this.prismaService.user.update({
                where: { ID: teacherDB.UserID },
                data: { HoTen: name }
            })
        ])
        return { ID: teacherId }
    }

    //xóa mềm giáo viên
    async DeleteTeacherByID(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const hasClass = await this.prismaService.lopHoc.findMany({
            where: {
                GiaoVienID: teacherId,
                TrangThai: { in: ['OPEN', 'RUNNING'] }
            },
            select: { TenLop: true }
        })
        if (hasClass.length > 0)
            throw new BadRequestException
                (`GV ${teacherDB.User.HoTen} đang dạy các lớp học khác. Hãy đổi giáo viên cho lớp trước khi thao tác.`)
        return await this.prismaService.giaoVien.update({
            where: { ID: teacherId }, data: { TrangThai: 'INACTIVE' },
            select: { ID: true }
        })
    }

    // khôi phục giáo viên
    async RestoreTeacherById(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        return await this.prismaService.giaoVien.update({
            where: { ID: teacherDB.ID, TrangThai: 'INACTIVE' },
            data: { TrangThai: 'ACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    //lấy danh sách lớp giáo viên đang dạy - phần dưới tab 1
    async GetClassesByTeacherID(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { GiaoVienID: teacherDB.ID },
            include: {
                khoahoc: true,
                buoihoc: { select: { ID: true }, orderBy: { BatDauLuc: 'asc' } },
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
            SiSo: lh.SiSo,
            TongSoBuoi: lh.khoahoc.TongSoBuoi,
            SoBuoiDaHoc: lh._count.buoihoc,
            IDBuoiDau: lh.buoihoc.map(item => item.ID)[0]
        }))
    }

    // lấy danh sách buổi học giáo viên đã dạy - tab 2
    async GetCompletedSS(teacherId: number) {
        const teacherDB = await this.TeacherIdValidator(teacherId)
        const sessionDB = await this.prismaService.buoiHoc.findMany({
            where: {
                lophoc: { GiaoVienID: teacherDB.ID },
                TrangThai: 'COMPLETED'
            },
            omit: {
                CreatedAt: true, UpdatedAt: true,
                AdminMoKhoa: true, LyDoMoKhoa: true,
                YeuCauMoKhoa: true, NgayYeuCau: true
            },
            orderBy: { BatDauLuc: 'asc' }
        })
        if (!sessionDB) return []
        return sessionDB
    }
}
