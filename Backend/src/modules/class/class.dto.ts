import { Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsDate, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import { TrangThaiLH } from "src/generated/prisma/enums";

export class CreateClassDTO {
    @IsNotEmpty()
    @IsString()
    code: string

    @IsNotEmpty()
    @IsNumber()
    courseId: number

    @IsNotEmpty()
    @IsNumber()
    teacherId: number

    @IsNotEmpty()
    @IsString()
    @MaxLength(150)
    name: string

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    fromDate: Date

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    toDate: Date

    @ArrayNotEmpty()
    @IsArray()
    @ArrayUnique()// mỗi phần tử là duy nhất
    @IsInt({ each: true })// mỗi phần tử là số nguyên
    @Min(0, { each: true })// mỗi phần tử nhỏ nhất là 0 - chủ nhật
    @Max(6, { each: true })// mỗi phần tử lớn nhất là 6 - thứ 7
    timeTable: number[]

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    startTime: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    endTime: string

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    classSize: number

    @IsOptional()
    room?:string
}

export class QueryClassDTO {
    @IsOptional()
    @IsEnum(TrangThaiLH)
    status?: TrangThaiLH

    @IsOptional()
    q?: string
}

export class UpdateClassDTO {
    @IsOptional()
    @IsInt()
    teacherId?: number

    @IsOptional()// không gửi lên thì thôi, gửi thì phải theo @
    @IsString()
    @MaxLength(150)
    name?: string // field có thể undefined để không báo lỗi khi code

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    room?: string

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fromDate?: Date

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    toDate?: Date

    @IsOptional()
    @ArrayNotEmpty()
    @IsArray()
    @ArrayUnique()// mỗi phần tử là duy nhất
    @IsInt({ each: true })// mỗi phần tử là số nguyên
    @Min(0, { each: true })// mỗi phần tử nhỏ nhất là 0 - chủ nhật
    @Max(6, { each: true })// mỗi phần tử lơn nhất là 6 - thứ 7
    timeTable?: number[]

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    startTime?: string

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 18:03)', })
    endTime?: string

    @IsOptional()
    @IsInt()
    @Min(0)
    classSize?: number
}

export class SchechuleDTO{
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    startDate: Date

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    endDate: Date
}