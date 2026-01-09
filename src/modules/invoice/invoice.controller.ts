import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { InvoiceService } from "./invoice.service";
import { QueryInvoiceDTO } from "./invoice.dto";

@Controller('admin/invoices')
export class InvoiceController {
    constructor(private invoiceService: InvoiceService){}

    //lấy danh sách hóa đơn
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get()
    async GetInvoices(@Query() query:QueryInvoiceDTO) {
        return this.invoiceService.GetInvoices(query)
    }
    //tìm kiếm mã hóa đơn, tên học viên
    //thêm phiếu thu
    //Lấy danh sách phiếu thu theo hóa đơn
}