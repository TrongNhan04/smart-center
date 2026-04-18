import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { EventModule } from "../event/events.module";

@Module({
    imports:[PrismaModule, EventModule],
    controllers: [PaymentController],
    providers: [PaymentService]
})
export class PaymentModule { }