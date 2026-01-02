import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { TrangThaiBH } from "src/generated/prisma/enums";

export class SessionStatusDTO{
    @IsOptional()
    @IsEnum(TrangThaiBH)
    status?: TrangThaiBH
}

export class CreateSessionDTO{
//     ChuDe      String?
//   BatDauLuc  DateTime 
//   KetThucLuc DateTime
//   MoTa       String?
    @IsOptional()
    @IsString()
    topic?:string

    @IsNotEmpty()
    @IsString()
    date: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    startAt: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    endAt: string

    @IsString()
    @IsOptional()
    description?: string
}