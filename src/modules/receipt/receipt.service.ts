import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ReceiptService {
    constructor(private prismaService: PrismaService) { }

    // kiểm tra trùng mã phiếu thu
    async ReceiptCodeValidator(code: string) {
        const receiptDB = await this.prismaService.phieuThu.findUnique({
            where: { MaPhieuThu: code }
        })
        if (receiptDB) throw new ConflictException("Receipt code was duplicate")
    }

    //thêm phiếu thu
    async CreateReceipt(invoiceId: number, amount: number) {
        const invoiceDB = await this.prismaService.hoaDon.findUnique({
            where: { ID: invoiceId }
        })
        if (!invoiceDB) throw new ConflictException('Invoice not existed')

        const totalAmount = invoiceDB.TongTien.toNumber()
        const paidAmount = invoiceDB.DaTra.toNumber()
        let count = await this.prismaService.phieuThu.count()
        const code = count < 10 ? "PT0" + (count + 1) : "PT" + (count + 1)
        const today = new Date()

        await this.ReceiptCodeValidator(code)

        if (amount > totalAmount - paidAmount)
            throw new BadRequestException('Amount must less than or equal Total')
        await this.prismaService.$transaction([
            // thêm phiếu thu
            this.prismaService.phieuThu.create({
                data: {
                    MaPhieuThu: code,
                    HoaDonID: invoiceId,
                    SoTien: amount,
                    NgayThu: today
                }
            }),
            //cập nhật hóa đơn
            this.prismaService.hoaDon.update({
                where: { ID: invoiceId },
                data: { DaTra: paidAmount + amount }
            })
        ])
        return { mgs: "Succesfull" }
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
}