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
    async getTransactions(@Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.getTransactions(query)
    }

    //lấy danh sách hóa đơn + tìm kiếm mã hóa đơn, tên học viên
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async getMany(@Query() query: QueryInvoiceDTO) {
        return await this.invoiceService.getMany(query)
    }

    //thêm giao dịch thu tiền
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/receipts')
    async createReceipt(
        @Param('id') invoiceId: number,
        @Body() body: CreateTransactionDTO,
        @Req() req: RequestWithUser) {
        return await this.invoiceService.createReceipt(
            +req.user.userId, +invoiceId, body)
    }

    // thêm giao dịch chi tiền
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/payments')
    async createPayment(
        @Param('id') invoiceId: number,
        @Body() body: CreateTransactionDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.userId
        return await this.invoiceService.createPayment(+userId, +invoiceId, body)
    }

    //Lấy danh sách giao dịch theo hóa đơn 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/transactions')
    async getTransactionsById(@Param('id') invoiceId: number,) {
        return await this.invoiceService.getTransactionsById(+invoiceId)
    }

    // lấy chi tiết hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id')
    async getOne(@Param('id') invoiceId: number) {
        return await this.invoiceService.getOne(+invoiceId)
    }
}