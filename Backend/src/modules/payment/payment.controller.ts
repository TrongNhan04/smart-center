import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { createPaymentDto } from "./payment.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";

@Controller('payments')
export class PaymentController{
    constructor(private paymentSv:PaymentService){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('ADMIN', 'TEACHER', 'PARENT')
    @Post()
    async CreatePayment(@Body() body:createPaymentDto){
        return this.paymentSv.CreatePayment(body)
    }

    @Post('webhook')
    async HandleWebhook(@Body() body:any){
        return this.paymentSv.HandleWebhook(body)
    }
}