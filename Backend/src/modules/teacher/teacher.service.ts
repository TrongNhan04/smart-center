import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeacherDTO, QueryTeacherDTO, UpdateTeacherDTO } from './teacher.dto';
import * as bcrypt from 'bcrypt'
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class TeacherService {
    constructor(private prismaService: PrismaService) { }

    //kiểm tra trùng mã giáo viên
    private async codeValidator(code: string) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { MaGiaoVien: code }
        })
        if (teacherDB) throw new BadRequestException('Mã giáo viên đã tồn tại')
    }

    //kiểm tra trùng email và số điện thoại
    private async userValidator(email: string, phone: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { Email: email },
                    { DienThoai: phone }
                ]
            }
        })
        if (user) { `${email} hoặc ${phone} đã được sử dụng` }
        return user
    }

    // kiểm tra giáo viên có tồn tại 
    private async idValidator(teacherId: number) {
        const teacherDB = await this.prismaService.giaoVien.findUnique({
            where: { ID: teacherId },
            include: { User: true },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
        if (!teacherDB) throw new NotFoundException('Không tìm thấy giáo viên')
        return teacherDB
    }

    // thêm giáo viên + user
    async create(body: CreateTeacherDTO) {
        await Promise.all([
            this.codeValidator(body.code),
            this.userValidator(body.email, body.phone)
        ])
        const hashPW = await bcrypt.hash(body.phone, 15)

        return await this.prismaService.user.create({
            data: {
                HoTen: body.name.trim(),
                Email: body.email,
                DienThoai: body.phone,
                MatKhauHash: hashPW,
                VaiTro: 'TEACHER',
                GiaoVien: {
                    create: {
                        MaGiaoVien: body.code,
                        NgaySinh: body.dob,
                        ChuyenMon: body.major,
                        DiaChi: body.address ?? null,
                    }
                }
            }
        })
    }

    // lấy danh sách + tìm kiếm + lọc theo điều kiện
    async getMany(query: QueryTeacherDTO) {
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
            include: { User: true },
            omit: { CreatedAt: true, UpdatedAt: true },
            orderBy: { CreatedAt: 'desc' }
        })
        return teacherDB.map(item => {
            const { User, ...rest } = item
            return {
                ...rest,
                HoTen: User.HoTen,
                Email: User.Email,
                DienThoai: User.DienThoai,
            }
        })
    }

    // lấy danh sách giáo viên cho combobox
    async getManyForCmb() {
        const teacherDB = await this.prismaService.giaoVien.findMany({
            where: { TrangThai: 'ACTIVE' },
            select: {
                ID: true, MaGiaoVien: true,
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
    async getOne(teacherId: number) {
        const teacherDB = await this.idValidator(teacherId)
        const { User, ...rest } = teacherDB
        return {
            ...rest,
            HoTen: teacherDB.User.HoTen,
            Email: teacherDB.User.Email,
            DienThoai: teacherDB.User.DienThoai,
        }
    }

    // sửa thông tin 1 giáo viên
    async updateById(teacherId: number, body: UpdateTeacherDTO) {
        const teacherDB = await this.idValidator(teacherId)
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: teacherDB.UserID }
        })
        if (!userDB) throw new NotFoundException('Không tìm thấy người dùng')

        const name = body.name ?? userDB.HoTen
        const major = body.major ?? teacherDB.ChuyenMon
        const address = body.address ?? teacherDB.DiaChi
        const dob = body.dob ?? teacherDB.NgaySinh
        return await this.prismaService.user.update({
            where: { ID: teacherDB.ID },
            data: {
                HoTen: name,
                GiaoVien: {
                    update: {
                        data: {
                            ChuyenMon: major,
                            DiaChi: address,
                            NgaySinh: dob
                        }
                    }
                }
            }
        })
    }

    //xóa mềm giáo viên
    async deleteById(teacherId: number) {
        const teacherDB = await this.idValidator(teacherId)
        return await this.prismaService.giaoVien.update({
            where: { ID: teacherDB.ID },
            data: { TrangThai: 'INACTIVE' },
            select: { ID: true }
        })
    }

    // khôi phục giáo viên
    async restore(teacherId: number) {
        const teacherDB = await this.idValidator(teacherId)
        return await this.prismaService.giaoVien.update({
            where: { ID: teacherDB.ID, TrangThai: 'INACTIVE' },
            data: { TrangThai: 'ACTIVE' },
            select: { ID: true }
        })
    }

    //lấy danh sách lớp giáo viên đang dạy - phần dưới tab 1
    async getClassesById(teacherId: number) {
        const teacherDB = await this.idValidator(teacherId)
        const classDB = await this.prismaService.lopHoc.findMany({
            where: { GiaoVienID: teacherDB.ID },
            include: {
                khoahoc: { select: { TongSoBuoi: true } },
                buoihoc: {
                    select: { ID: true },
                    orderBy: { BatDauLuc: 'asc' },
                    take: 1
                },
                _count: {
                    select:
                    {
                        ghidanh: { where: { TrangThai: 'ACTIVE' } },
                        buoihoc: { where: { TrangThai: 'COMPLETED' } }
                    }
                }
            },
            omit: { CreatedAt: true, UpdatedAt: true }
        })
        if (classDB.length == 0) return []
        return classDB.map(lh => {
            const { khoahoc, buoihoc, _count, GioBatDau, GioKetThuc, ...rest } = lh
            return {
                ...rest,
                GioHoc: GioBatDau + ' - ' + GioKetThuc,
                TongGhiDanh: _count.ghidanh,
                TongSoBuoi: khoahoc.TongSoBuoi,
                SoBuoiDaHoc: _count.buoihoc,
                IDBuoiDau: buoihoc.map(item => item.ID)[0]
            }
        })
    }

    // lấy danh sách buổi học giáo viên đã dạy - tab 2
    async getCompletedSS(teacherId: number) {
        const teacherDB = await this.idValidator(teacherId)
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
