import { Module } from "@nestjs/common";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ReceiptService } from "../receipt/receipt.service";

@Module({
    controllers:[InvoiceController],
    providers:[InvoiceService, PrismaService, ReceiptService],
    exports:[InvoiceService]
})
export class InvoiceModule{}