import { IsNotEmpty, IsPositive, IsString } from "class-validator";

export class CreatePaymentDTO{
    @IsNotEmpty()
    @IsPositive()
    amount: number

    @IsNotEmpty()
    @IsString()
    reason: string
}