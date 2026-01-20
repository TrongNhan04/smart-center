import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { QueryInvoiceDTO } from "./invoice.dto";

@Injectable()
export class InvoiceService {
    constructor(
        private prismaService: PrismaService,
    ) { }

    //kiểm tra id hóa đơn
    async InvoiceValidator(invoiceId: number) {
        const invoiceDB = this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId }
        })
        if (!invoiceDB) throw new NotFoundException('Invoice not found')
        return invoiceDB
    }

    // tạo hóa đơn
    async CreateInvoice(enrollId: number, dueDate: Date, toTal: number, tx: Prisma.TransactionClient) {
        let count = await this.prismaService.hoaDon.count()
        const code = count < 10 ? "HD0" + (count + 1) : "HD" + (count + 1)
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        const invoice = await client.hoaDon.create({
            data: {
                MaHoaDon: code,
                ThoiHan: dueDate,
                TongTien: toTal,
                GhiDanhID: enrollId
            },
            select: {
                ThoiHan: true,
                TongTien: true,
                ghidanh: {
                    select: {
                        HocVienID: true,
                        lophoc: {
                            select: { ID: true, TenLop: true }
                        }
                    }
                }
            }
        })
        const flat = {
            ThoiHan: invoice.ThoiHan,
            TongTien: invoice.TongTien,
            HocVienID: invoice.ghidanh.HocVienID,
            LopHocID: invoice.ghidanh.lophoc.ID,
            TenLop: invoice.ghidanh.lophoc.TenLop
        }
        return flat
    }

    // lấy danh sách hóa đơn + tìm kiếm 
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
        // x=>({}) tương đương với (x) => { return {} }
        return invoiceDB.map(invoice => ({
            MaHoaDon: invoice.MaHoaDon,
            TenHocVien: invoice.ghidanh.hocvien.TenHocVien,
            TenLop: invoice.ghidanh.lophoc.TenLop,
            TongTien: invoice.TongTien,
            DaTra: invoice.DaTra,
            NgayPhatHanh: invoice.CreatedAt.toLocaleDateString('vi-VN'),
            NgayHetHan: invoice.ThoiHan.toLocaleDateString('vi-VN')
        }))
    }

    // xóa mềm hóa đơn()
    async DeleteInvoiceByID(invoiceId: number, tx: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        await this.InvoiceValidator(invoiceId)
        return await client.hoaDon.update({
            where: { ID: invoiceId },
            data: { TrangThai: 'CANCELLED' }
        })
    }
}