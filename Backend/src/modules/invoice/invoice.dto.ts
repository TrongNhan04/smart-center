import { IsEnum, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";
import { TrangThai_HD } from "src/generated/prisma/enums";

export class QueryInvoiceDTO{
    @IsOptional()
    @IsEnum(TrangThai_HD)
    status?:TrangThai_HD

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

    @IsOptional()
    @IsString()
    note?: string
}