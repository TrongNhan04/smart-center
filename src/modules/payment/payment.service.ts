import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreatePaymentDTO } from "./payment.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService
    ) { }

    // tạo phiếu chi từ hóa đơn id
    async CreatePayment(userId: number, invoiceId: number, body: CreatePaymentDTO) {
        const reason = body.reason.trim()
        return this.prisma.$transaction(async tx => {
            // tạo phiếu chi, cập nhật đã trả
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
}