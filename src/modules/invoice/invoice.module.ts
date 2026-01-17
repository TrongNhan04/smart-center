import { Module } from "@nestjs/common";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { ReceiptModule } from "../receipt/receipt.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports:[ReceiptModule, PrismaModule],
    controllers:[InvoiceController],
    providers:[InvoiceService],
    exports:[InvoiceService]
})
export class InvoiceModule{}