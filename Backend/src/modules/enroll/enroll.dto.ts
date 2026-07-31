import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { TrangThai_GD } from 'src/generated/prisma/enums';

export class CreateEnrollDTO {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  studentId!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  classId!: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  fee!: number;
}

export class QueryEnrollDTO {
  @IsOptional()
  @IsEnum(TrangThai_GD)
  status?: TrangThai_GD;

  @IsOptional()
  q?: string;
}
