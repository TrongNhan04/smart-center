import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateEnrollDTO, QueryEnrollDTO } from "./enroll.dto";
import { InvoiceService } from "../invoice/invoice.service";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class EnrollService {
    constructor(
        private prismaService: PrismaService,
        private invoiceService: InvoiceService,
        private notisService: NotifyService
    ) { }

    // tạo ghi danh tự động
    async CreateEnrollAuto(studentId: number, classId: number, tx: Prisma.TransactionClient) {
        const today = new Date()
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        return await client.ghiDanh.create({
            data: {
                LopHocID: classId,
                HocVienID: studentId,
                NgayGhiDanh: today
            },
            omit: { UpdatedAt: true, CreatedAt: true }
        })
    }

    //tạo ghi danh thủ công + hóa đơn + thông báo
    async CreateEnroll(body: CreateEnrollDTO) {
        const classDB = await this.ClassIdValidator(body.classId)
        const studentDB = await this.StudentIdValidator(body.studentId)
        await this.EnrollValidator(studentDB.ID, classDB.ID)
        await this.TotalSlot(classDB.ID)
        return await this.prismaService.$transaction(async (tx) => {
            const newEnroll = await tx.ghiDanh.create({
                data: {
                    HocVienID: studentDB.ID,
                    LopHocID: classDB.ID,
                    NgayGhiDanh: new Date()
                }
            })
            // thêm hóa đơn
            const newInvoice = await this.invoiceService.CreateInvoice
                (studentDB.ID, newEnroll.ID, classDB.DenNgay, body.fee, tx)
            // thêm thông báo
            await this.notisService.InvoiceNotify(studentDB.UserID, newInvoice, classDB, tx)
            return { ID: newEnroll.ID }
        })
    }

    // danh sách ghi danh, bộ lọc trạng thái, tìm kiếm theo từ khóa
    async GetEnrolls(query: QueryEnrollDTO) {
        const where: Prisma.GhiDanhWhereInput = {}
        const q = query.q?.trim()

        if (query.status)
            where.TrangThai = query.status

        if (q) {
            where.OR = [
                { lophoc: { TenLop: { contains: q, mode: 'insensitive' } } },
                { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } },
                { hocvien: { MaHocVien: { contains: q, mode: 'insensitive' } } }
            ]
        }
        const enrollDB = await this.prismaService.ghiDanh.findMany({
            where,
            select: {
                ID: true, NgayGhiDanh: true, TrangThai: true, GhiChu: true,
                lophoc: { select: { ID: true, TenLop: true } },
                hocvien: {
                    select: {
                        ID: true,
                        TenHocVien: true,
                        MaHocVien: true
                    }
                }
            },
            orderBy: { NgayGhiDanh: 'desc' }
        })
        return enrollDB.map(e => ({
            ID: e.ID,
            LopHocID: e.lophoc.ID,
            TenLop: e.lophoc.TenLop,
            HocVienID: e.hocvien.ID,
            MaHocVien: e.hocvien.MaHocVien,
            TenHocVien: e.hocvien.TenHocVien,
            NgayGhiDanh: e.NgayGhiDanh,
            GhiChu: e.GhiChu,
            TrangThai: e.TrangThai
        }))
    }

    // xóa mềm ghi danh + xóa mềm hóa đơn
    async DeleteEnrollByID(enrollId: number) {
        return this.prismaService.$transaction(async tx => {
            const enrollDB = await tx.ghiDanh.findUnique({
                where: { ID: enrollId },
                include: { hoadon: true }
            })
            if (!enrollDB) throw new NotFoundException('Không tìm thấy ghi danh')
            if (!enrollDB.hoadon)
                throw new ConflictException('Không tìm thấy hóa đơn của ghi danh')

            await tx.ghiDanh.update({
                where: { ID: enrollId },
                data: { TrangThai: 'INACTIVE' }
            })

            await this.invoiceService.DeleteInvoiceByID(enrollDB.hoadon.ID, tx)
            return { ID: enrollDB.ID }
        })
    }

    // lấy danh sách ghi danh ACTIVE theo lớp
    async GetEnrollByClassId(classId: number) {
        const enrolls = await this.prismaService.ghiDanh.findMany({
            where: { LopHocID: classId, TrangThai: 'ACTIVE' },
            select: {
                hocvien: {
                    select:
                    {
                        MaHocVien: true, TenHocVien: true,
                        Parent: { select: { Email: true, DienThoai: true, HoTen: true } }
                    }
                },
            }
        })
        return enrolls.map(x => ({
            MaHocVien: x.hocvien.MaHocVien,
            TenHocVien: x.hocvien.TenHocVien,
            TenPhuHuynh: x.hocvien.Parent.HoTen,
            Email: x.hocvien.Parent.Email,
            DienThoai: x.hocvien.Parent.DienThoai
        }))

    }

    // kiểm tra slot lớp
    async TotalSlot(classId: number) {
        const classDB = await this.ClassIdValidator(classId)

        const totolEnroll = await this.prismaService.ghiDanh.count({
            where: { LopHocID: classDB.ID, TrangThai: 'ACTIVE' }
        })

        if (totolEnroll == classDB.SiSo)
            throw new ConflictException('Lớp đã đầy')
    }

    // kiểm tra 1 học viên ghi danh 1 lớp 1 lần
    private async EnrollValidator(studentId: number, classId: number) {
        const existed = await this.prismaService.ghiDanh.findFirst({
            where: {
                LopHocID: classId,
                HocVienID: studentId,
                TrangThai: 'ACTIVE'
            }
        })
        if (existed) throw new ConflictException
            (`Học viên đã ghi danh vào lớp ngày ${existed.NgayGhiDanh.toLocaleDateString()}`)
    }

    // kiểm tra id lớp
    private async ClassIdValidator(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })
        if (!classDB) throw new ConflictException('Không tìm thấy lớp học')
        if (classDB.TrangThai === 'CLOSED')
            throw new ConflictException('Lớp đã đóng!')
        return classDB
    }

    //kiểm tra id học viên
    private async StudentIdValidator(studentId: number) {
        const studentDB = await this.prismaService.hocVien.findUnique({
            where: { ID: studentId }
        })
        if (!studentDB) throw new NotFoundException('Không tìm thấy học viên')
        if (studentDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Học viên đã nghỉ học')
        return studentDB
    }
}