import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { QueryInvoiceDTO } from "./invoice.dto";

@Injectable()
export class InvoiceService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    // tạo hóa đơn
    async CreateInvoice(enrollId: number, dueDate: Date, toTal: number, tx: Prisma.TransactionClient) {
        // await this.enrollService.EnrollValidator(enrollId)
        const count = await this.prismaService.hoaDon.count()
        count == 0 ? 1 : count
        const code = count < 10 ? "HD0" + count : "HD" + count
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        return await client.hoaDon.create({
            data: {
                MaHoaDon: code,
                ThoiHan: dueDate,
                TongTien: toTal,
                GhiDanhID: enrollId
            }
        })
    }

    // lấy danh sách hóa đơn
    //Mã HD	Học viên	lớp học	Số tiền	Ngày phát hành	Hạn thanh toán	Trạng thái	Thao tác
    async GetInvoices(query: QueryInvoiceDTO) {
        const where: Prisma.HoaDonWhereInput = {}
        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { MaHoaDon: { contains: q, mode: 'insensitive' } },
                { ghidanh: { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } } }
            ]
        }
        const invoiceDB = await this.prismaService.hoaDon.findMany({
            where,
            select: {
                MaHoaDon: true,
                ghidanh: {
                    select: {
                        hocvien: { select: { TenHocVien: true } },
                        lophoc: { select: { TenLop: true } }
                    }
                },
                TongTien: true,
                DaTra: true,
                CreatedAt: true,//ngày phát hành
                ThoiHan: true
            }
        })
        // x=>({}) tương đương với (x) => { return {}; }
        return invoiceDB.map(invoice => ({
            MaHoaDon: invoice.MaHoaDon,
            TenHocVien: invoice.ghidanh.hocvien.TenHocVien,
            TenLop: invoice.ghidanh.lophoc.TenLop,
            TongTien: invoice.TongTien,
            DaTra: invoice.DaTra,
            NgayPhatHanh: invoice.CreatedAt,
            NgayHetHan: invoice.ThoiHan
        }))
    }
}