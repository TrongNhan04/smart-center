import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { InvoiceService } from "./invoice.service";
import { CreatePaymentDTO, CreateReceiptDTO, QueryInvoiceDTO } from "./invoice.dto";
import { Request } from 'express';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('admin/invoices')
export class InvoiceController {
    constructor(private invoiceService: InvoiceService) { }

    // lấy toàn bộ phiếu thu + phiếu chi
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('receipts-payments')
    async GetAllReceipt_Payment(@Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.GetAllReceipt_Payment(query)
    }

    //lấy danh sách hóa đơn + tìm kiếm mã hóa đơn, tên học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetInvoices(
        @Query() query: QueryInvoiceDTO) {
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
        return await this.invoiceService.CreateReceipt(
            +req.user.userId, +invoiceId, body)
    }

    //Lấy danh sách phiếu thu theo hóa đơn 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/receipts')
    async GetReceipts(@Param('id') invoiceId: number,) {
        return await this.invoiceService.GetReceipts(+invoiceId)
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
        return await this.invoiceService.CreatePayment
            (+userId, +invoiceId, body)
    }

    // lấy danh sách phiếu chi theo hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/payments')
    async GetPayments(@Param('id') invoiceId: number,) {
        return await this.invoiceService.GetPayments(+invoiceId)
    }

    // lấy chi tiết hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetInvoice(@Param('id') invoiceId: number) {
        return await this.invoiceService.GetInvoice(+invoiceId)
    }
}