import { Module } from "@nestjs/common";
import { ReceiptController } from "./receipt.controller";
import { ReceiptService } from "./receipt.service";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
    imports:[PrismaModule],
    controllers:[ReceiptController],
    providers:[ReceiptService],
    exports:[ReceiptService]
})
export class ReceiptModule{}