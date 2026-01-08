import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { ClassService } from "../class/class.service";
import { CreateEnrollDTO, QueryEnrollDTO } from "./enroll.dto";
import { InvoiceService } from "../invoice/invoice.service";

@Injectable()
export class EnrollService {
    constructor(
        private prismaService: PrismaService,
        private classService: ClassService,
        private invoiceService: InvoiceService
    ) { }

    // kiểm tra slot lớp
    async TotalSlot(classId: number) {
        const classDB = await this.classService.GetClassById(classId)
        if (!classDB) throw new ConflictException('Class is not found')

        const totolEnroll = await this.prismaService.ghiDanh.count({
            where: { LopHocID: classId, TrangThai: 'ACTIVE' }
        })

        if (totolEnroll == classDB.SiSo)
            throw new ConflictException('Class was full')
    }

    // kiểm tra 1 học viên ghi danh 1 lớp 1 lần
    async EnrollValidator(studentId: number, classId: number) {
        const existed = await this.prismaService.ghiDanh.findFirst({
            where: { LopHocID: classId, HocVienID: studentId }
        })
        if (existed) throw new ConflictException('Student has enrolled class')
    }

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
        const classDB = await this.classService.ClassIDValidator(body.classId)
        const studentDB = await this.prismaService.hocVien.findUnique({
            where: { ID: body.studentId }
        })
        if (!studentDB) throw new ConflictException('Student is not existed')
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
                {
                    hocvien: {
                        TenHocVien: { contains: q, mode: 'insensitive' },
                        MaHocVien: { contains: q, mode: 'insensitive' }
                    }
                }
            ]
        }
        return await this.prismaService.ghiDanh.findMany({
            where,
            omit: { CreatedAt: true, UpdatedAt: true }
        })
    }

    // xóa mềm 
    async DeleteEnrollByID(enrollId: number){
        const enrollDB = await this.prismaService.ghiDanh.findUnique({
            where:{ID:enrollId}
        })
        if(!enrollDB) throw new BadRequestException('Enroll not found')
        
        return await this.prismaService.ghiDanh.update({
            where:{ID:enrollId},
            data:{TrangThai:'INACTIVE'},
            omit:{CreatedAt:true, UpdatedAt:true}
        })
    }
}