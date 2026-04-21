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
        return await client.hoaDon.create({
            data: {
                HocVienID: studentId,
                GhiDanhID: enrollId,
                MaHoaDon: DateHelper.CreateUniqueCode('HD'),
                ThoiHan: dueDate,
                TongTien: total,
            }
        })
    }

    // lấy chi tiết hóa đơn
    async GetInvoice(invoiceId: number) {
        const invoiceDB = await this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId },
            include: {
                hocvien: {
                    select: {
                        TenHocVien: true,
                        Parent: { select: { DienThoai: true } }
                    }
                },
                ghidanh: { select: { lophoc: { select: { TenLop: true } } } },
            },omit:{UpdatedAt:true}
        })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        return this.FormatedInv(invoiceDB)
    }

    private FormatedInv = (invoiceDB:any) => {
        const {ghidanh, hocvien, CreatedAt, ThoiHan, ...restInv} = invoiceDB
        return {
            ...restInv,
            TenLop: ghidanh.lophoc.TenLop ?? null,
            TenHocVien: hocvien.TenHocVien,
            DienThoai: hocvien.Parent.DienThoai,
            NgayPhatHanh: CreatedAt,//
            NgayHetHan: ThoiHan,//
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
                include: {
                    hocvien: {
                        select: {
                            TenHocVien: true,
                            Parent: { select: { DienThoai: true } }
                        }
                    },
                    ghidanh: { select: { lophoc: { select: { TenLop: true } } } },
                },
                take: take, skip: skip,
                orderBy: { MaHoaDon: 'desc' },
                omit:{UpdatedAt:true}
            })
        ])

        const mapData = invoiceDB.map(item => this.FormatedInv(item))
        return {
            total: total,
            items: mapData
        }
    }

    //thêm giao dịch thu tiền theo hóa đơn id
    async CreateReceipt(userId: number, invoiceId: number,
        body: CreateTransactionDTO) {
        const invoiceDB = await  this.prismaService.hoaDon.findUnique({ 
            where: { ID: invoiceId },
                include: { hocvien: { select: { UserID: true } } } 
            })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')
        if (invoiceDB.TrangThai === 'CANCELLED') throw new BadRequestException
            ('Hóa đơn đã hủy, không thể thu tiền!')

        const remain = Number(invoiceDB.TongTien) - Number(invoiceDB.DaTra)
        if (body.amount > remain) throw new BadRequestException
            (`Số tiền thu không được vượt quá ${remain} đ`)

        return await this.prismaService.$transaction(async tx => {
            const newReceipt = await tx.giaoDich.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceDB.ID,
                    MaGiaoDich: DateHelper.CreateUniqueCode('MGD'),
                    LoaiGiaoDich: 'RECEIPT',
                    NgayGiaoDich: new Date(),
                    SoTien: body.amount,
                    PhuongThuc: body.method,
                    GhiChu: body.note
                }, 
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
        const invoiceDB = await
            this.prismaService.hoaDon.findUnique({
                where: { ID: invoiceId }
            })
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')

        if (invoiceDB.TrangThai === 'ACTIVE') throw new ConflictException
            ('Hóa đơn vẫn còn hiệu thực, không thể tạo phiếu hoàn tiền')

        const daTra = Number(invoiceDB.DaTra)
        if (daTra == 0) throw new BadRequestException
            ('Hóa đơn chưa thanh toán, không cần tạo phiếu hoàn tiền')

        if (body.amount > daTra) throw new BadRequestException
            ('Số tiền hoàn phải nhỏ hơn hoặc bằng số tiền đã trả')

        return this.prismaService.$transaction(async tx => {
            await tx.giaoDich.create({
                data: {
                    UserID: userId,
                    HoaDonID: invoiceDB.ID,
                    MaGiaoDich: DateHelper.CreateUniqueCode('MGD'),
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

    // lấy danh sách giao dịch theo id hóa đơn
    async GetTransactionsById(invoiceId: number) {
        const invoiceDB = await this.InvoiceValidator(invoiceId)
        if (!invoiceDB) throw new NotFoundException('Không tìm thấy hóa đơn')

        const receiptDB = await this.prismaService.giaoDich.findMany({
            where: { HoaDonID: invoiceDB.ID },
            include:{user:{select:{HoTen:true}}},
            orderBy: { NgayGiaoDich: 'asc' },
            omit:{CreatedAt:true, UpdatedAt:true}
        })
        return receiptDB.map(item => {
            const {user, ...rest} = item
            return {
                ...rest,
                ThuNgan: user?.HoTen
            }
        })
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
        
        const flatItems = items.map(item=>({
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