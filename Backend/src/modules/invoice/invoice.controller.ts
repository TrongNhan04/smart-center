import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { InvoiceService } from "./invoice.service";
import { CreateTransactionDTO, QueryInvoiceDTO } from "./invoice.dto";
import { Request } from 'express';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('admin/invoices')
export class InvoiceController {
    constructor(private invoiceService: InvoiceService) { }

    // lấy toàn bộ giao dịch có query + phân trang 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('transactions')
    async GetTransactions(@Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.GetTransactions(query)
    }

    //lấy danh sách hóa đơn + tìm kiếm mã hóa đơn, tên học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetInvoices(
        @Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.GetInvoices(query)
    }

    //thêm giao dịch thu tiền
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/receipts')
    async CreateInvoices(
        @Param('id') invoiceId: number,
        @Body() body: CreateTransactionDTO,
        @Req() req: RequestWithUser) {
        return await this.invoiceService.CreateReceipt(
            +req.user.userId, +invoiceId, body)
    }

    // thêm giao dịch chi tiền
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/payments')
    async CreatePayment(
        @Param('id') invoiceId: number,
        @Body() body: CreateTransactionDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.userId
        return await this.invoiceService.CreatePayment
            (+userId, +invoiceId, body)
    }

    //Lấy danh sách giao dịch theo hóa đơn 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/transactions')
    async GetTransactionsById(@Param('id') invoiceId: number,) {
        return await this.invoiceService.GetTransactionsById(+invoiceId)
    }

    // lấy chi tiết hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async GetInvoice(@Param('id') invoiceId: number) {
        return await this.invoiceService.GetInvoice(+invoiceId)
    }
}