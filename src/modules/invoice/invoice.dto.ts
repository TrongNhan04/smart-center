import { IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class QueryInvoiceDTO{
    @IsOptional()
    q?:string
}

export class CreatePaymentDTO{
    @IsNotEmpty()
    @IsPositive()
    amount: number

    @IsNotEmpty()
    @IsString()
    reason: string
}

export class CreateReceiptDTO{
    @IsNotEmpty()
    @IsPositive()
    amount: number
}