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
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        const invoiceDB = await client.hoaDon.findFirst({
            orderBy: { ID: 'desc' },
            select: { ID: true }
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        const code = 'HD' + (invoiceDB.ID + 1)

        const newInvoice = await client.hoaDon.create({
            data: {
                MaHoaDon: code,
                ThoiHan: dueDate,
                TongTien: toTal,
                GhiDanhID: enrollId
            },
            select: {
                ThoiHan: true, TongTien: true,
                ghidanh: {
                    select: {
                        HocVienID: true,
                        lophoc: { select: { ID: true, TenLop: true } }
                    }
                }
            }
        })
        const flat = {
            ThoiHan: newInvoice.ThoiHan,
            TongTien: newInvoice.TongTien,
            HocVienID: newInvoice.ghidanh.HocVienID,
            LopHocID: newInvoice.ghidanh.lophoc.ID,
            TenLop: newInvoice.ghidanh.lophoc.TenLop
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
                                ID: true, TenHocVien: true,
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
                TongTien: true, DaTra: true,
                CreatedAt: true,//ngày phát hành
                ThoiHan: true, TrangThai: true
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
        const [invoiceDB, receiptDB] = await Promise.all([
            this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId },
                select: {
                    TongTien: true, DaTra: true, TrangThai: true,
                    ghidanh: { select: { hocvien: { select: { UserID: true } } } }
                }
            }),
            this.prismaService.phieuThu.findFirst({
                orderBy: { ID: 'desc' }, select: { ID: true }
            })
        ])
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        if (invoiceDB.TrangThai === 'CANCELLED') throw new BadRequestException
            ('Hóa đơn đã hủy, không thể thu tiền!')

        const remain = Number(invoiceDB.TongTien) - Number(invoiceDB.DaTra)
        if (body.amount > remain) throw new BadRequestException
            (`Số tiền thu không được vượt quá ${remain} đ`)

        let code = ''
        if (!receiptDB) code = "PT0"
        else code = "PT" + (receiptDB.ID + 1)

        return await this.prismaService.$transaction(async tx => {
            const newReceipt = await tx.phieuThu.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceId,
                    MaPhieuThu: code,
                    NgayThu: new Date(),
                    SoTien: body.amount,
                    PhuongThuc: body.method,
                    GhiChu: body.note
                }, omit: { CreatedAt: true, UpdatedAt: true }
            })

            await tx.hoaDon.update({
                where: { ID: invoiceId },
                data: { DaTra: { increment: body.amount } }
            })

            await this.notisService.PaymentNotify
                (+invoiceDB.ghidanh.hocvien.UserID, newReceipt, tx)
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
        const [invoiceDB, paymentDB] = await Promise.all([
            this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId }
            }),
            this.prismaService.phieuChi.findFirst({
                orderBy: { ID: 'desc' }, select: { ID: true }
            })
        ])
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')

        if (invoiceDB.TrangThai === 'ACTIVE') throw new ConflictException
            ('Hóa đơn vẫn còn hiệu thực, không thể tạo phiếu hoàn tiền')

        const daTra = Number(invoiceDB.DaTra)
        if (daTra == 0) throw new BadRequestException
            ('Hóa đơn chưa thanh toán, không cần tạo phiếu hoàn tiền')

        if (body.amount > daTra) throw new BadRequestException
            ('Số tiền hoàn phải nhỏ hơn hoặc bằng số tiền đã trả')

        let code = ''
        if (!paymentDB) code = "PC0" // ko có phiếu chi
        else code = 'PC' + (paymentDB.ID + 1)

        return this.prismaService.$transaction(async tx => {
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

    // lấy toàn bộ phiếu thu + chi
    async GetAllReceipt_Payment(page: number) {
        const limit = 10
        const offset = (page - 1) * limit
        return await this.prismaService.$queryRaw`
            SELECT pt."ID", "MaPhieuThu" AS MaPhieu, "HoaDonID", "SoTien", 
                    "NgayThu" AS Ngay, "PhuongThuc", 
                    "GhiChu", 'RECEIPT' AS Loai, nd."HoTen"
            FROM "PhieuThu" pt
            LEFT JOIN "User" nd on pt."UserID" = nd."ID"
	
            UNION ALL
            
            SELECT pc."ID", "MaPhieuChi" AS MaPhieu, "HoaDonID", "SoTien", 
                "NgayChi" AS Ngay, "PhuongThuc", "LyDo" as GhiChu, 
                'PAYMENT' AS Loai, nd."HoTen"
            FROM "PhieuChi" pc
            LEFT JOIN "User" nd on pc."UserID" = nd."ID"
            
            ORDER BY Ngay DESC
            LIMIT ${limit} OFFSET ${offset}`
    }
}