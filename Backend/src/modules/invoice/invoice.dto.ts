import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TrangThai_HD } from 'src/generated/prisma/enums';

export class QueryInvoiceDTO {
  @IsNotEmpty()
  page!: number;

  @IsOptional()
  @IsEnum(TrangThai_HD)
  status?: TrangThai_HD;

  @IsOptional()
  q?: string;

  // @IsOptional()
  // overdue:string
}

export class QueryTransaction {
  page!: number;

  @IsOptional()
  month?: number;

  @IsOptional()
  year?: number;
}

export class CreateTransactionDTO {
  @IsNotEmpty()
  @IsPositive()
  amount!: number;

  @IsNotEmpty()
  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
