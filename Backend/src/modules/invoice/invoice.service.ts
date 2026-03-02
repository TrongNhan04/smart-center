import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { CreatePaymentDTO, CreateReceiptDTO, QueryInvoiceDTO } from "./invoice.dto";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class InvoiceService {
    constructor(
        private prismaService: PrismaService,
        private notisService: NotifyService
    ) { }

    //kiểm tra id hóa đơn
    private async InvoiceValidator(invoiceId: number) {
        const invoiceDB = this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId }
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        return invoiceDB
    }

    // tạo hóa đơn tự động
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

    // lấy chi tiết hóa đơn
    async GetInvoice(invoiceId: number) {
        const invoiceDB = await this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId },
            select: {
                ID: true, MaHoaDon: true, TongTien: true,
                DaTra: true, TrangThai: true, CreatedAt: true, ThoiHan: true,
                ghidanh: {
                    select: {
                        hocvien: {
                            select: {
                                ID:true, TenHocVien: true,
                                Parent: { select: { DienThoai: true } }
                            }
                        },
                        lophoc: { select: { TenLop: true } }
                    }
                }
            }
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        return {
            ID: invoiceDB.ID,
            MaHoaDon: invoiceDB.MaHoaDon,
            TenLop: invoiceDB.ghidanh.lophoc.TenLop,
            HocVienID: invoiceDB.ghidanh.hocvien.ID,
            TenHocVien: invoiceDB.ghidanh.hocvien.TenHocVien,
            DienThoai: invoiceDB.ghidanh.hocvien.Parent.DienThoai,
            TongTien: invoiceDB.TongTien,
            DaTra: invoiceDB.DaTra,
            NgayPhatHanh: invoiceDB.CreatedAt,
            NgayHetHan: invoiceDB.ThoiHan,
            TrangThai: invoiceDB.TrangThai
        }
    }

    // lấy danh sách hóa đơn + tìm kiếm 
    async GetInvoices(query: QueryInvoiceDTO) {
        const where: Prisma.HoaDonWhereInput = {}
        const q = query.q?.trim()
        if (query.status)
            where.TrangThai = query.status
        if (q) {
            where.OR = [
                { MaHoaDon: { contains: q, mode: 'insensitive' } },
                { ghidanh: { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } } }
            ]
        }
        const invoiceDB = await this.prismaService.hoaDon.findMany({
            where,
            select: {
                ID: true, MaHoaDon: true,
                ghidanh: {
                    select: {
                        hocvien: {
                            select: {
                                TenHocVien: true, ID: true,
                                Parent: { select: { DienThoai: true } }
                            }
                        },
                        lophoc: { select: { TenLop: true, ID: true } }
                    }
                },
                TongTien: true,
                DaTra: true,
                CreatedAt: true,//ngày phát hành
                ThoiHan: true,
                TrangThai: true
            },
            orderBy: { MaHoaDon: 'desc' }
        })
        return invoiceDB.map(item => ({
            ID: item.ID,
            MaHoaDon: item.MaHoaDon,
            TenHocVien: item.ghidanh.hocvien.TenHocVien,
            TenLop: item.ghidanh.lophoc.TenLop,
            DienThoai: item.ghidanh.hocvien.Parent.DienThoai,
            TongTien: item.TongTien,
            DaTra: item.DaTra,
            NgayPhatHanh: item.CreatedAt,
            NgayHetHan: item.ThoiHan,
            TrangThai: item.TrangThai
        }))
    }

    // xóa mềm hóa đơn theo hủy ghi danh
    async DeleteInvoiceByID(invoiceId: number, tx: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        return await client.hoaDon.update({
            where: { ID: invoiceDB?.ID },
            data: { TrangThai: 'CANCELLED' }
        })
    }

    //thêm phiếu thu
    async CreateReceipt(userId: number, invoiceId: number,
        body: CreateReceiptDTO) {

        return await this.prismaService.$transaction(async tx => {
            const invoiceDB = await this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId },
                select: {
                    TongTien: true, DaTra: true, TrangThai: true,
                    ghidanh: { select: { hocvien: { select: { UserID: true } } } }
                }
            })
            if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
            if (invoiceDB.TrangThai === 'CANCELLED')
                throw new BadRequestException('Hóa đơn đã hủy, không thể thu tiền!')

            const remain = invoiceDB.TongTien.toNumber() - invoiceDB.DaTra.toNumber()
            if (body.amount > remain)
                throw new BadRequestException(`Số tiền thu không được vượt quá ${remain} đ`)

            let count = await this.prismaService.phieuThu.count()
            const code = count < 9 ? "PT0" + (count + 1) : "PT" + (count + 1)

            //await this.ReceiptCodeValidator(code)
            const receipt = await tx.phieuThu.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceId,
                    MaPhieuThu: code,
                    NgayThu: new Date(),
                    SoTien: body.amount,
                    GhiChu: body.note
                }, omit: { CreatedAt: true, UpdatedAt: true }
            })

            await tx.hoaDon.update({
                where: { ID: invoiceId },
                data: { DaTra: { increment: body.amount } }
            })

            await this.notisService.PaymentNotify(+invoiceDB.ghidanh.hocvien.UserID, receipt)
            return { ID: invoiceId }
        })
    }

    // lấy danh sách phiếu thu theo hóa đơn
    async GetReceipts(invoiceId: number) {
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        const receiptDB = await this.prismaService.phieuThu.findMany({
            where: { HoaDonID: invoiceDB.ID },
            select: {
                ID: true,
                MaPhieuThu: true,
                NgayThu: true,
                SoTien: true,
                PhuongThuc: true,
                user: { select: { HoTen: true } },
                GhiChu: true
            },
            orderBy: { NgayThu: 'asc' }
        })
        return receiptDB.map(item => ({
            ID: item.ID,
            MaPhieuThu: item.MaPhieuThu,
            NgayThu: item.NgayThu,
            SoTien: item.SoTien,
            PhuongThuc: item.PhuongThuc,
            ThuNgan: item.user.HoTen,
            GhiChu: item.GhiChu
        }))
    }

    // lấy danh sách phiếu chi theo hóa đơn
    async GetPayments(invoiceId: number) {
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        const paymentDB = await this.prismaService.phieuChi.findMany({
            where: { HoaDonID: invoiceDB.ID },
            select: {
                ID: true,
                MaPhieuChi: true,
                NgayChi: true,
                SoTien: true,
                PhuongThuc: true,
                user: { select: { HoTen: true } },
                LyDo: true
            },
            orderBy: { NgayChi: 'asc' }
        })
        return paymentDB.map(item => ({
            ID: item.ID,
            MaPhieuChi: item.MaPhieuChi,
            NgayChi: item.NgayChi,
            SoTien: item.SoTien,
            PhuongThuc: item.PhuongThuc,
            ThuNgan: item.user.HoTen,
            LyDo: item.LyDo
        }))
    }

    // tạo phiếu chi từ hóa đơn id
    async CreatePayment(userId: number, invoiceId: number, body: CreatePaymentDTO) {
        const reason = body.reason.trim()
        return this.prismaService.$transaction(async tx => {
            const invoiceDB = await tx.hoaDon.findUnique({
                where: { ID: invoiceId }
            })
            if (!invoiceDB) throw new NotFoundException
                ('Không tìm thấy hóa đơn')

            if (invoiceDB.TrangThai !== 'CANCELLED')
                throw new ConflictException
                    ('Hóa đơn vẫn còn hiệu thực, không thể tạo phiếu hoàn tiền')

            if (Number(invoiceDB.DaTra) == 0)
                throw new BadRequestException
                    ('Hóa đơn chưa thanh toán, không cần tạo phiếu hoàn tiền')

            if (body.amount > Number(invoiceDB.DaTra))
                throw new BadRequestException
                    ('Số tiền cần hoàn phải nhỏ hơn hoặc bằng số tiền đã trả')
            // tạo phiếu chi
            const count = await tx.phieuChi.count()
            const code = count < 9 ? 'PC0' + (count + 1) : 'PC' + (count + 1)

            await tx.phieuChi.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceDB.ID,
                    MaPhieuChi: code,
                    SoTien: body.amount,
                    LyDo: reason,
                    NgayChi: new Date(),
                }
            })
            // cập nhật đã trả
            await tx.hoaDon.update({
                where: { ID: invoiceDB.ID },
                data: {
                    DaTra: { decrement: body.amount }
                }
            })

            return { ID: invoiceId }
        })
    }

    // kiểm tra trùng mã phiếu thu
    // private async ReceiptCodeValidator(code: string) {
    //     const receiptDB = await this.prismaService.phieuThu.findUnique({
    //         where: { MaPhieuThu: code }
    //     })
    //     if (receiptDB) throw new ConflictException("Receipt code was duplicate")
    // }
}