import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createPaymentDto {
    @IsNotEmpty()
    @IsString()
    orderId!: string;
}

