import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, Min, ValidateNested } from "class-validator";
import { TrangThaiBH } from "src/generated/prisma/enums";

export class SessionStatusDTO {
    @IsOptional()
    @IsEnum(TrangThaiBH)
    status?: TrangThaiBH
}

export class CreateSessionDTO {
    @IsNotEmpty()
    @IsNumber()
    classId: number

    @IsOptional()
    @IsString()
    topic?: string

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    date: Date

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, 18:03)', })
    startAt: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, 18:03)', })
    endAt: string

    @IsString()
    @IsOptional()
    description?: string

    @IsOptional()
    @IsString()
    room?: string
}

export class UpdateSessionDTO{
    @IsOptional()
    @IsString()
    topic?:string

    @IsOptional()
    @IsString()
    room?: string
}

export class Pagination{
    page:number
    limit:number
}
