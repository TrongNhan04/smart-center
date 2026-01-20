import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { InvoiceService } from "./invoice.service";
import { QueryInvoiceDTO } from "./invoice.dto";
import { ReceiptService } from "../receipt/receipt.service";
import { CreateReceiptDTO } from "../receipt/receipt.dto";
import { Request } from 'express';
import { CreatePaymentDTO } from "../payment/payment.dto";
import { PaymentService } from "../payment/payment.service";

type RequestWithUser = Request & { user: { userId: number; role?: string } };


@Controller('admin/invoices')
export class InvoiceController {
    constructor(
        private invoiceService: InvoiceService,
        private receiptService: ReceiptService,
        private paymentService: PaymentService
    ) { }

    //lấy danh sách hóa đơn + tìm kiếm mã hóa đơn, tên học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetInvoices(@Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.GetInvoices(query)
    }

    //thêm phiếu thu
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/receipts')
    async CreateInvoices(
        @Param('id') invoiceId: number,
        @Body() body: CreateReceiptDTO,
        @Req() req: RequestWithUser) {
        return await this.receiptService.CreateReceipt(+req.user.userId, +invoiceId, body.amount)
    }

    //Lấy danh sách phiếu thu theo hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/receipts')
    async GetReceipts(@Param('id') invoiceId: number,) {
        return await this.receiptService.GetReceiptsByInvoiceID(+invoiceId)
    }

    // thêm phiếu chi
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/payments')
    async CreatePayment(
        @Param('id') invoiceId: number,
        @Body() body: CreatePaymentDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.userId
        return await this.paymentService.CreatePayment(+userId, +invoiceId, body)
    }
}