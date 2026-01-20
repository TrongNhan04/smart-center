import { IsNotEmpty, IsNumber, IsPositive, Min } from "class-validator";

export class CreateReceiptDTO{
    @IsNotEmpty()
    @IsPositive()
    amount: number
}