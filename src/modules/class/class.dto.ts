import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import { TrangThaiLH } from "src/generated/prisma/enums";

export class CreateClassDTO {
    @IsNotEmpty()
    @IsString()
    code: string

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    courseId: number

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    teacherId: number

    @IsNotEmpty()
    @IsString()
    @MaxLength(150)
    name: string

    description?: string

    @IsNotEmpty()
    fromDay: string

    @IsNotEmpty()
    toDay: string

    @ArrayNotEmpty()
    @IsArray()
    @ArrayUnique()// mỗi phần tử là duy nhất
    @IsInt({ each: true })// mỗi phần tử là số nguyên
    @Min(0, { each: true })// mỗi phần tử nhỏ nhất là 0 - chủ nhật
    @Max(6, { each: true })// mỗi phần tử lơn nhất là 6 - thứ 7
    timeTable: number[]

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 14:30)', })
    startTime: string

    @IsNotEmpty()
    @IsString()
    @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        { message: 'Time must be in valid 24-hour format (HH:MM, e.g., 14:30)', })
    endTime: string

    @IsNotEmpty()
    @IsInt()
    classSize: number
}

export class ClassQueryDTO{
    @IsOptional()
    status?: TrangThaiLH

    @IsOptional()
    q?: string
}