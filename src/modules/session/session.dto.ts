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
}

export class UpdateSessionDTO{
    @IsOptional()
    @IsString()
    topic?:string

    @IsOptional()
    @IsString()
    room?: string
}

// định nghĩa lớp con
export class ResultDetailDTO {
    @IsNotEmpty()
    @IsNumber()
    enrollmentId: number

    @IsOptional()
    @IsString()
    privateComment?: string

    @IsBoolean()
    isAttend: boolean

    @IsOptional()
    @IsNumber()
    @Min(0) @Max(10)
    score?: number
}

//đinh nghĩa lớp cha
export class SessionsResultDTO{
    @IsString()
    comment:string

    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>ResultDetailDTO)
    details: ResultDetailDTO[]
}