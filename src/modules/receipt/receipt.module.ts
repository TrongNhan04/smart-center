import { Module } from "@nestjs/common";
import { ReceiptController } from "./receipt.controller";
import { ReceiptService } from "./receipt.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { NotifyModule } from "../notify/notify.module";

@Module({
    imports:[PrismaModule, NotifyModule],
    controllers:[ReceiptController],
    providers:[ReceiptService],
    exports:[ReceiptService]
})
export class ReceiptModule{}