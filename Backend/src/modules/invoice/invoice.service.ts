import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { CreatePaymentDTO, QueryInvoiceDTO } from "./invoice.dto";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class InvoiceService {
    constructor(
        private prismaService: PrismaService,
        private notisService: NotifyService
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
        const code = count < 9 ? "HD0" + (count + 1) : "HD" + (count + 1)
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

    //thêm phiếu thu
    async CreateReceipt(userId: number, invoiceId: number, amount: number) {
        if (amount <= 0) throw new ConflictException('Paymount must greater than 0')

        return await this.prismaService.$transaction(async tx => {
            const invoiceDB = await this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId },
                select: {
                    TongTien: true, DaTra: true, TrangThai:true,
                    ghidanh: { select: { hocvien: { select: { UserID: true } } } }
                }
            })
            if (!invoiceDB) throw new ConflictException('Invoice not existed')
            if(invoiceDB.TrangThai === 'CANCELLED')
                throw new BadRequestException('Invoice is CANCELLED')

            const remain = invoiceDB.TongTien.toNumber() - invoiceDB.DaTra.toNumber()
            if (amount > remain)
                throw new BadRequestException('Amount must less than or equal Remain')

            let count = await this.prismaService.phieuThu.count()
            const code = count < 9 ? "PT0" + (count + 1) : "PT" + (count + 1)

            await this.ReceiptCodeValidator(code)
            const receipt = await tx.phieuThu.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceId,
                    MaPhieuThu: code,
                    NgayThu: new Date(),
                    SoTien: amount
                }, omit: { CreatedAt: true, UpdatedAt: true }
            })

            await tx.hoaDon.update({
                where: { ID: invoiceId },
                data: { DaTra: { increment: amount } }
            })

            await this.notisService.PaymentNotify(+invoiceDB.ghidanh.hocvien.UserID, receipt)
            return { mgs: "Create receipt and notisy successfully" }
        })
    }

    // lấy danh sách phiếu thu theo hóa đơn
    async GetReceiptsByInvoiceID(invoiceId: number) {
        return await this.prismaService.phieuThu.findMany({
            where: { HoaDonID: invoiceId },
            omit: {
                HoaDonID: true,
                UpdatedAt: true, CreatedAt: true
            }
        })
    }

    // lấy danh sách phiếu chi theo hóa đơn
    async GetPaymentByInvoiceID(invoiceId:number){
        const invoiceDB = await this.prismaService.hoaDon.findUnique({
            where:{ID:invoiceId}
        })
        if(!invoiceDB) throw new NotFoundException('Invoice not found')
        return await this.prismaService.phieuChi.findMany({
            where:{HoaDonID:invoiceId},
            omit:{HoaDonID:true}
        })
    }

    // tạo phiếu chi từ hóa đơn id
    async CreatePayment(userId: number, invoiceId: number, body: CreatePaymentDTO) {
        const reason = body.reason.trim()
        return this.prismaService.$transaction(async tx => {
            const invoiceDB = await tx.hoaDon.findUnique({
                where: { ID: invoiceId }
            })
            if (!invoiceDB) throw new NotFoundException('Invoice not found')

            if(body.amount>invoiceDB.DaTra.toNumber())
                throw new BadRequestException('Payment must less than or equal to paidment')
            // tạo phiếu chi
            await tx.phieuChi.create({
                data: {
                    HoaDonID: invoiceDB.ID,
                    SoTien: body.amount,
                    LyDo: reason,
                    NgayChi: new Date(),
                    NguoiLapID: userId
                }
            })
            // cập nhật đã trả
            await tx.hoaDon.update({
                where: { ID: invoiceDB.ID },
                data: {
                    DaTra: { decrement: body.amount }
                }
            })

            return {mgs:"Succesfull"}
        })
    }

    // kiểm tra trùng mã phiếu thu
    private async ReceiptCodeValidator(code: string) {
        const receiptDB = await this.prismaService.phieuThu.findUnique({
            where: { MaPhieuThu: code }
        })
        if (receiptDB) throw new ConflictException("Receipt code was duplicate")
    }
}