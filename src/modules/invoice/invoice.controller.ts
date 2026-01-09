import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { InvoiceService } from "./invoice.service";
import { QueryInvoiceDTO } from "./invoice.dto";
import { ReceiptService } from "../receipt/receipt.service";
import { CreateReceiptDTO } from "../receipt/receipt.dto";

@Controller('admin/invoices')
export class InvoiceController {
    constructor(private invoiceService: InvoiceService,
        private receiptService: ReceiptService
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
    @Post(':id/receipt')
    async CreateInvoices(@Param('id') invoiceId: number,
        @Body() body: CreateReceiptDTO) {
        return await this.receiptService.CreateReceipt(+invoiceId, body.amount)
    }
    //Lấy danh sách phiếu thu theo hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get(':id/receipts')
    async GetReceipts(@Param('id') invoiceId: number,) {
        return await this.receiptService.GetReceiptsByInvoiceID(+invoiceId)
    }
}