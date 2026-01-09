import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class CreateReceiptDTO{
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    amount: number
}