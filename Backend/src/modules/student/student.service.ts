import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateStudentDTO, QueryStudentDTO, UpdateStudentDTO } from "./student.dto";
import { Prisma } from "src/generated/prisma/client";
import * as bcrypt from 'bcrypt'
import { EnrollService } from "../enroll/enroll.service";
import { InvoiceService } from "../invoice/invoice.service";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class StudentService {
    constructor(
        private prismaService: PrismaService,
        private enrollService: EnrollService,
        private invoiceService: InvoiceService,
        private notisService: NotifyService
    ) { }

    // thêm học viên + ghi danh + hóa đơn 
    private async AddRecord_3Table(userId: number, body: CreateStudentDTO,
        tx?: Prisma.TransactionClient) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: body.classId },
            select: {
                ID: true, DenNgay: true,
                khoahoc: { select: { HocPhi: true } }
            }
        })
        if (!classDB) throw new NotFoundException('Không tìm thấy lớp học')
        const fee = body.fee ?? classDB.khoahoc.HocPhi

        const runLogic = async (client: Prisma.TransactionClient) => {
            const newStudent = await client.hocVien.create({
                data: {
                    MaHocVien: body.code.trim(),
                    TenHocVien: body.student.trim(),
                    NgaySinh: body.dob,
                    UserID: userId
                },
                omit: { CreatedAt: true, UpdatedAt: true }
            })

            //thêm ghi danh
            const newEnroll = await this.enrollService.CreateEnrollAuto
                (newStudent.ID, body.classId, client)

            // thêm hóa đơn
            const newInvoice = await this.invoiceService.CreateInvoice
                (newEnroll.ID, classDB?.DenNgay, fee, client)

            // thêm thông báo
            await this.notisService.InvoiceNotify(userId, newInvoice, client)
            return newStudent
        }
        // nếu có user
        if (tx) return await runLogic(tx)
        else { // ko có 
            return await this.prismaService.$transaction(async (newTX) => {
                return await runLogic(newTX)
            })
        }
    }

    // thêm học viên dựa vào user
    async CreateStudent(body: CreateStudentDTO) {
        await this.StudentCodeValidator(body.code)
        await this.enrollService.TotalSlot(body.classId)
        const userDB = await this.prismaService.user.findMany({
            where: {
                OR: [{ Email: body.email }, { DienThoai: body.phone }]
            }
        })
        // ko có user => tạo mới
        if (userDB.length == 0) {
            const hashPW = await bcrypt.hash(body.phone, 10)
            return await this.prismaService.$transaction(async (tx) => {
                // thêm user
                const newUser = await tx.user.create({
                    data: {
                        HoTen: body.parent.trim(),
                        Email: body.email,
                        DienThoai: body.phone,
                        MatKhauHash: hashPW,
                        VaiTro: 'PARENT'
                    }
                })
                return await this.AddRecord_3Table(newUser.ID, body, tx)
            })
        }
        else if (userDB.length == 1) {// tìm được 1 user => user cũ
            const oldUser = userDB[0]
            return await this.AddRecord_3Table(oldUser.ID, body)
        }
        else// tìm được nhiều hơn 1 user => trùng Email hoặc phone
            throw new ConflictException
                ("Email và số điện thoại được dùng bởi 2 người khác nhau")
    }

    // lấy danh sách + tìm kiếm + lọc theo điều kiện
    async GetStudents(query: QueryStudentDTO) {
        const where: Prisma.HocVienWhereInput = {}
        const q = query.q?.trim()
        if (query.status)
            where.TrangThai = query.status

        if (q) {
            where.OR = [
                { TenHocVien: { contains: q, mode: 'insensitive' } },
                { MaHocVien: { contains: q, mode: 'insensitive' } },
                { Parent: { HoTen: { contains: q, mode: 'insensitive' } } }
            ]
        }
        const studentDB = await this.prismaService.hocVien.findMany({
            where,
            orderBy: { CreatedAt: 'desc' },
            include: { Parent: true }
        })
        return studentDB.map(item => ({
            ID: item.ID,
            MaHocVien: item.MaHocVien,
            TenHocVien: item.TenHocVien,
            NgaySinh: item.NgaySinh,
            DiaChi: item.DiaChi,
            PhuHuynh: item.Parent.HoTen,
            DienThoai: item.Parent.DienThoai,
            Email: item.Parent.Email,
            TrangThai: item.TrangThai
        }))
    }

    // lấy chi tiết 1 học viên - phần trên
    async GetStudentByID(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        if (!studentDB)
            throw new NotFoundException('Không tìm thấy học viên')
        return {
            ID: studentDB.ID,
            MaHocVien: studentDB.MaHocVien,
            TenHocVien: studentDB.TenHocVien,
            NgaySinh: studentDB.NgaySinh,
            DiaChi: studentDB.DiaChi,
            PhuHuynh: studentDB.Parent.HoTen,
            DienThoai: studentDB.Parent.DienThoai,
            Email: studentDB.Parent.Email,
            TrangThai: studentDB.TrangThai
        }
    }

    // sửa thông tin 1 học viên
    async UpdateStudentByID(studentId: number, body: UpdateStudentDTO) {
        await this.StudentIdValidator(studentId)
        const data: Prisma.HocVienUpdateInput = {}

        data.TenHocVien = body.student?.trim()
        data.GhiChu = body.note?.trim()
        return await this.prismaService.hocVien.update({
            where: { ID: studentId },
            data, omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    //xóa mềm học viên + hủy ghi danh
    async DeleteStudentByID(studentId: number) {
        await this.StudentIdValidator(studentId)
        await this.prismaService.$transaction([
            this.prismaService.hocVien.update({
                where: { ID: studentId, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            }),
            this.prismaService.ghiDanh.updateMany({
                where: { HocVienID: studentId, TrangThai: 'ACTIVE' },
                data: { TrangThai: 'INACTIVE' }
            })
        ])
    }

    //lấy danh sách lớp học viên học - phần dưới
    async GetClassesByStudentID(studentId: number) {
        await this.StudentIdValidator(studentId)
        const enrollDB = await this.prismaService.ghiDanh.findMany({
            where: { HocVienID: studentId },
            select: {
                lophoc: {
                    select: {
                        MaLopHoc: true,
                        TenLop: true,
                        giaovien: { select: { User: { select: { HoTen: true } } } }
                    }
                },
            }
        })
        return enrollDB.map(x => ({
            MaLopHoc: x.lophoc.MaLopHoc,
            TenLop: x.lophoc.TenLop,
            GiaoVien: x.lophoc.giaovien.User.HoTen
        }))
    }

    async GetCompletedSS(studentId: number) {
        const studentDB = await this.StudentIdValidator(studentId)
        const result = await this.prismaService.ketQua_ChiTiet.findMany({
            where: {
                ghidanh: { HocVienID: studentDB.ID }
            },
            select: {
                ID: true, NhanXetRieng:true, DiemDanh:true, Diem:true,
                ketqua_buoihoc: {
                    select: {
                        NhanXetChung:true,
                        buoihoc: true,
                        giaovien: {
                            select: { User: { select: { HoTen: true } } }
                        }
                    }
                }
            }
        })
        return result.map(item => ({
            ID: item.ID, // id kết quả chi tiết
            BuoiSo: item.ketqua_buoihoc.buoihoc.BuoiSo,
            ChuDe: item.ketqua_buoihoc.buoihoc.ChuDe,
            BatDauLuc: item.ketqua_buoihoc.buoihoc.BatDauLuc,
            KetThucLuc: item.ketqua_buoihoc.buoihoc.KetThucLuc,
            PhongHoc: item.ketqua_buoihoc.buoihoc.PhongHoc,
            GiaoVien: item.ketqua_buoihoc?.giaovien.User.HoTen,
            NhanXet: item.NhanXetRieng || item.ketqua_buoihoc.NhanXetChung,
            DiemDanh: item.DiemDanh,
            Diem: item.Diem
        }))
    }

    //kiểm tra trùng mã học viên
    private async StudentCodeValidator(code: string) {
        const StudentDB = await this.prismaService.hocVien.findUnique({
            where: { MaHocVien: code }
        })
        if (StudentDB) throw new BadRequestException('Student code was duplicate')
    }

    // kiểm tra học viên có tồn tại 
    private async StudentIdValidator(studentId: number) {
        const StudentDB = await this.prismaService.hocVien.findUnique({
            where: { ID: studentId },
            omit: { UpdatedAt: true, CreatedAt: true },
            include: { Parent: true }
        })
        if (!StudentDB) throw new BadRequestException('Student is not existed')
        return StudentDB
    }
}