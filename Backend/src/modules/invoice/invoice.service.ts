import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "src/generated/prisma/client";
import { CreateTransactionDTO, QueryInvoiceDTO, QueryTransaction } from "./invoice.dto";
import { NotifyService } from "../notify/notify.service";
import { GiaoDichWhereInput } from "src/generated/prisma/models";
import { DateHelper } from "src/common/date.helper";

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
    async CreateInvoice(studentId: number, enrollId: number, dueDate: Date,
        total: number, tx: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        const invoiceDB = await client.hoaDon.findFirst({
            orderBy: { ID: 'desc' },
            select: { ID: true }
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        const code = 'HD' + (invoiceDB.ID + 1)

        return await client.hoaDon.create({
            data: {
                HocVienID: studentId,
                GhiDanhID: enrollId,
                MaHoaDon: code,
                ThoiHan: dueDate,
                TongTien: total,
            }
        })
    }

    // lấy chi tiết hóa đơn
    async GetInvoice(invoiceId: number) {
        const invoiceDB = await this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId },
            select: {
                ID: true, MaHoaDon: true, TongTien: true, HocVienID: true,
                DaTra: true, TrangThai: true, CreatedAt: true, ThoiHan: true,
                hocvien: {
                    select: {
                        TenHocVien: true,
                        Parent: { select: { DienThoai: true } }
                    }
                },
                ghidanh: { select: { lophoc: { select: { TenLop: true } } } },
            }
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        return {
            ID: invoiceDB.ID,
            MaHoaDon: invoiceDB.MaHoaDon,
            TenLop: invoiceDB.ghidanh?.lophoc.TenLop ?? null,
            HocVienID: invoiceDB.HocVienID,
            TenHocVien: invoiceDB.hocvien.TenHocVien,
            DienThoai: invoiceDB.hocvien.Parent.DienThoai,
            TongTien: invoiceDB.TongTien,
            DaTra: invoiceDB.DaTra,
            NgayPhatHanh: invoiceDB.CreatedAt,
            NgayHetHan: invoiceDB.ThoiHan,
            TrangThai: invoiceDB.TrangThai
        }
    }

    // lấy danh sách hóa đơn + tìm kiếm 
    async GetInvoices(query: QueryInvoiceDTO) {
        const take = 12
        const skip = (query.page - 1) * take || 0
        const where: Prisma.HoaDonWhereInput = {}
        
        const q = query.q?.trim()
        if (query.status)
            where.TrangThai = query.status
        if (q) {
            where.OR = [
                { MaHoaDon: { contains: q, mode: 'insensitive' } },
                { hocvien: { TenHocVien: { contains: q, mode: 'insensitive' } } }
            ]
        }
        const [total, invoiceDB] = await Promise.all([
            this.prismaService.hoaDon.count({ where }),
            this.prismaService.hoaDon.findMany({
                where,
                select: {
                    ID: true, MaHoaDon: true, TongTien: true, HocVienID: true,
                    DaTra: true, TrangThai: true, CreatedAt: true, ThoiHan: true,
                    hocvien: {
                        select: {
                            TenHocVien: true,
                            Parent: { select: { DienThoai: true } }
                        }
                    },
                    ghidanh: { select: { lophoc: { select: { TenLop: true } } } },
                },
                take: take, skip: skip,
                orderBy: { MaHoaDon: 'desc' }
            })
        ])

        const mapData = invoiceDB.map(item => ({
            ID: item.ID,
            MaHoaDon: item.MaHoaDon,
            HocVienID: item.HocVienID,
            TenHocVien: item.hocvien.TenHocVien,
            TenLop: item.ghidanh?.lophoc.TenLop ?? null,
            DienThoai: item.hocvien.Parent.DienThoai,
            TongTien: item.TongTien,
            DaTra: item.DaTra,
            NgayPhatHanh: item.CreatedAt,
            NgayHetHan: item.ThoiHan,
            TrangThai: item.TrangThai
        }))
        return {
            total: total,
            items: mapData
        }
    }

    // xóa mềm hóa đơn theo hủy ghi danh
    async DeleteInvoiceByID(invoiceId: number, tx: Prisma.TransactionClient) {
        let client: Prisma.TransactionClient | null = null
        if (tx) client = tx
        else client = this.prismaService
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        return await client.hoaDon.update({
            where: { ID: invoiceDB.ID },
            data: { TrangThai: 'CANCELLED' }
        })
    }

    //thêm giao dịch thu tiền theo hóa đơn id
    async CreateReceipt(userId: number, invoiceId: number,
        body: CreateTransactionDTO) {
        const [invoiceDB, receiptDB] = await Promise.all([
            this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId },
                select: {
                    TongTien: true, DaTra: true, TrangThai: true,
                    hocvien: { select: { UserID: true } }
                }
            }), // lấy ID mới nhất của giao dịch để tạo mã
            this.prismaService.giaoDich.findFirst({
                orderBy: { ID: 'desc' }, select: { ID: true }
            })
        ])
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        if (invoiceDB.TrangThai === 'CANCELLED') throw new BadRequestException
            ('Hóa đơn đã hủy, không thể thu tiền!')

        const remain = Number(invoiceDB.TongTien) - Number(invoiceDB.DaTra)
        if (body.amount > remain) throw new BadRequestException
            (`Số tiền thu không được vượt quá ${remain} đ`)

        let code = '' ;
        if (!receiptDB) code = "PT0" // chưa có giao dịch nào hết
        else code = "PT" + (receiptDB.ID + 1)

        return await this.prismaService.$transaction(async tx => {
            const newReceipt = await tx.giaoDich.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceId,
                    MaGiaoDich: code,
                    LoaiGiaoDich: 'RECEIPT',
                    NgayGiaoDich: new Date(),
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
                (+invoiceDB.hocvien.UserID, newReceipt, tx)
            return { ID: invoiceId }
        })
    }

    // thêm giao dịch chi tiền theo hóa đơn id
    async CreatePayment(userId: number, invoiceId: number,
        body: CreateTransactionDTO) {
        const reason = body.note?.trim() || null
        const [invoiceDB, paymentDB] = await Promise.all([
            this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId }
            }),
            this.prismaService.giaoDich.findFirst({
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
        if (!paymentDB) code = "PC0" // chưa có giao dịch nào hết
        else code = 'PC' + (paymentDB.ID + 1)

        return this.prismaService.$transaction(async tx => {
            await tx.giaoDich.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceDB.ID,
                    MaGiaoDich: code,
                    LoaiGiaoDich:'PAYMENT',
                    NgayGiaoDich: new Date(),
                    SoTien: body.amount,
                    PhuongThuc: body.method,
                    GhiChu: reason,
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

    // lấy danh sách giao dịch theo hóa đơn id
    async GetTransactionsById(invoiceId: number) {
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')

        const receiptDB = await this.prismaService.giaoDich.findMany({
            where: { HoaDonID: invoiceDB.ID },
            select: {
                ID: true, MaGiaoDich: true, NgayGiaoDich: true,
                LoaiGiaoDich:true, SoTien: true, PhuongThuc: true,
                user: { select: { HoTen: true } }, GhiChu: true
            },
            orderBy: { NgayGiaoDich: 'asc' }
        })
        return receiptDB.map(item => ({
            ID: item.ID,
            MaGD: item.MaGiaoDich,
            LoaiGD: item.LoaiGiaoDich,
            NgayGD: item.NgayGiaoDich,
            SoTien: item.SoTien,
            PhuongThuc: item.PhuongThuc,
            ThuNgan: item.user?.HoTen || null,
            GhiChu: item.GhiChu
        }))
    }

    // lấy toàn bộ giao dịch theo tháng - năm + phân trang
    async GetTransactions(query: QueryTransaction) {
        const take = 10
        const skip = (query.page - 1) * take || 0
        
        const now = new Date()
        const m = query.month ?? now.getMonth()
        const y = query.year ?? now.getFullYear()
        
        const { start, end } = DateHelper.GetStartEndOfMonth(new Date(y, m))
        const where:GiaoDichWhereInput = {
            NgayGiaoDich:{ gte:start, lt: end}
        }
        
        const [total, items] = await Promise.all([
            this.prismaService.giaoDich.count({where:where}),
            this.prismaService.giaoDich.findMany({
                where:where,
                select:{
                    ID: true, MaGiaoDich:true, HoaDonID:true, SoTien:true,
                    NgayGiaoDich:true, PhuongThuc:true, GhiChu:true,
                    LoaiGiaoDich:true, user:{select:{HoTen:true}},
                    hoadon:{select:{hocvien:{select:{TenHocVien:true}}}}
                },
                take:take,
                skip:skip
            })
        ]) 
        
        const flatItems =  items.map(item=>({
            ID: item.ID, MaGD: item.MaGiaoDich, HoaDonID: item.HoaDonID,
            SoTien: item.SoTien, NgayGD: item.NgayGiaoDich,
            PhuongThuc: item.PhuongThuc, GhiChu:item.GhiChu,
            LoaiGD: item.LoaiGiaoDich,
            ThuNgan: item.user?.HoTen || null,
            TenHocVien: item.hoadon?.hocvien.TenHocVien || null
        }))
        return {
            total: total,
            items: flatItems
        }
    }
}


// https://github.com/prisma/prisma/discussions/20568 lỗi tìm kiếm
// this.prismaService.$queryRaw`
//             SELECT pt."ID", "MaPhieuThu" AS MaPhieu, "HoaDonID", "SoTien", 
//                 "NgayThu" AS Ngay, "PhuongThuc", pt."GhiChu", 
//                 'RECEIPT' AS Loai, nd."HoTen" as ThuNgan, hv."TenHocVien"
            
//             FROM "PhieuThu" pt 
//             LEFT JOIN "HoaDon" hd on pt."HoaDonID" = hd."ID"
//             LEFT JOIN "HocVien" hv on hd."HocVienID" = hv."ID"
//             LEFT JOIN "User" nd on pt."UserID" = nd."ID"
//             WHERE (${search}::text is null 
//                     OR hv."TenHocVien" like '%' || ${search} || '%'
//                     OR pt."MaPhieuThu" like '%' || ${search} || '%')

//             UNION ALL
            
//             SELECT pc."ID", "MaPhieuChi" AS MaPhieu, "HoaDonID", "SoTien", 
//                 "NgayChi" AS Ngay, "PhuongThuc", pc."LyDo", 'PAYMENT' AS Loai, 
//                 nd."HoTen" as ThuNgan, hv."TenHocVien"
            
//             FROM "PhieuChi" pc
//             LEFT JOIN "HoaDon" hd on pc."HoaDonID" = hd."ID"
//             LEFT JOIN "HocVien" hv on hd."HocVienID" = hv."ID"
//             LEFT JOIN "User" nd on pc."UserID" = nd."ID"
//             WHERE (${search}::text is null or hv."TenHocVien" like '%' || ${search} || '%')
//                 AND(${search}::text is null or pc."MaPhieuChi" like '%' || ${search} || '%')

//             ORDER BY Ngay DESC
//             LIMIT ${limit} OFFSET ${offset}`