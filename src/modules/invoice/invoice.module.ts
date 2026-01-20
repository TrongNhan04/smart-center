import { Module } from "@nestjs/common";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { ReceiptModule } from "../receipt/receipt.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { PaymentModule } from "../payment/payment.module";
import { NotifyModule } from "../notify/notify.module";

@Module({
    imports:[ReceiptModule, PrismaModule, PaymentModule, NotifyModule],
    controllers:[InvoiceController],
    providers:[InvoiceService],
    exports:[InvoiceService]
})
export class InvoiceModule{}