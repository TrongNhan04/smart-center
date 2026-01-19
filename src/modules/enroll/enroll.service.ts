import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateEnrollDTO, QueryEnrollDTO } from "./enroll.dto";
import { InvoiceService } from "../invoice/invoice.service";

@Injectable()
export class EnrollService {
    constructor(
        private prismaService: PrismaService,
        private invoiceService: InvoiceService
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

    //tạo ghi danh thủ công
    async CreateEnroll(body: CreateEnrollDTO) {
        const today = new Date()
        const classDB = await this.ClassIdValidator(body.classId)
        await this.StudentIdValidator(body.studentId)
        await this.EnrollValidator(body.studentId, body.classId)
        await this.TotalSlot(body.classId)

        return await this.prismaService.$transaction(async (tx) => {
            const newEnroll = await tx.ghiDanh.create({
                data: {
                    HocVienID: body.studentId,
                    LopHocID: body.classId,
                    NgayGhiDanh: today
                }
            })

            await this.invoiceService.CreateInvoice(newEnroll.ID, classDB.DenNgay, body.fee, tx)
            return { mgs: "Succesfull" }
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
        return await this.prismaService.ghiDanh.findMany({
            where,
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // xóa mềm 
    async DeleteEnrollByID(enrollId: number) {
        const enrollDB = await this.prismaService.ghiDanh.findUnique({
            where: { ID: enrollId }
        })
        if (!enrollDB) throw new BadRequestException('Enroll not found')

        return await this.prismaService.ghiDanh.update({
            where: { ID: enrollId },
            data: { TrangThai: 'INACTIVE' },
            omit: { CreatedAt: true, UpdatedAt: true }
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
                        MaHocVien: true, TenHocVien: true, TenPhuHuynh: true,
                        Parent: { select: { Email: true, DienThoai: true } }
                    }
                },
            }
        })
        return enrolls.map(x => ({
            MaHocVien: x.hocvien.MaHocVien,
            TenHocVien: x.hocvien.TenHocVien,
            TenPhuHuynh: x.hocvien.TenPhuHuynh,
            Email: x.hocvien.Parent.Email,
            DienThoai: x.hocvien.Parent.DienThoai
        }))

    }

    // kiểm tra slot lớp
    async TotalSlot(classId: number) {
        const classDB = await this.ClassIdValidator(classId)

        const totolEnroll = await this.prismaService.ghiDanh.count({
            where: { LopHocID: classId, TrangThai: 'ACTIVE' }
        })

        if (totolEnroll == classDB.SiSo)
            throw new ConflictException('Class was full')
    }

    // kiểm tra 1 học viên ghi danh 1 lớp 1 lần
    private async EnrollValidator(studentId: number, classId: number) {
        const existed = await this.prismaService.ghiDanh.findFirst({
            where: { LopHocID: classId, HocVienID: studentId }
        })
        if (existed) throw new ConflictException('Student has enrolled class')
    }

    // kiểm tra id lớp
    private async ClassIdValidator(classId: number) {
        const classDB = await this.prismaService.lopHoc.findUnique({
            where: { ID: classId }
        })
        if (!classDB) throw new ConflictException('Class is not found')
        return classDB
    }

    //kiểm tra id học viên
    private async StudentIdValidator(studentId: number) {
        const studentDB = await this.prismaService.hocVien.findUnique({
            where: { ID: studentId }
        })
        if (!studentDB) throw new NotFoundException('Student is not existed')
        if (studentDB.TrangThai === 'INACTIVE')
            throw new ConflictException('Student is inactive')
        return studentDB
    }
}