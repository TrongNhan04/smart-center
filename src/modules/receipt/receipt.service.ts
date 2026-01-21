import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class ReceiptService {
    constructor(
        private prismaService: PrismaService,
        private notisService: NotifyService
    ) { }

    // kiểm tra trùng mã phiếu thu
    async ReceiptCodeValidator(code: string) {
        const receiptDB = await this.prismaService.phieuThu.findUnique({
            where: { MaPhieuThu: code }
        })
        if (receiptDB) throw new ConflictException("Receipt code was duplicate")
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

            await this.notisService.PaymentNotify(invoiceDB.ghidanh.hocvien.UserID, receipt)
            return { mgs: "Create receipt and notisy successfully" }
        })
    }

    //Lấy danh sách phiếu thu theo hóa đơn
    async GetReceiptsByInvoiceID(invoiceId: number) {
        return await this.prismaService.phieuThu.findMany({
            where: { HoaDonID: invoiceId },
            omit: {
                HoaDonID: true,
                UpdatedAt: true, CreatedAt: true
            }
        })
    }

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
}