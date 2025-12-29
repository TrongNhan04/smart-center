import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator"
import { TrangThaiKH } from "src/generated/prisma/enums"

export class CreateCourseDTO{
    @IsNotEmpty()
    @IsString()
    code: string // mã khóa học

    @IsNotEmpty()
    @IsString()
    @MaxLength(150)
    name: string

    @IsNotEmpty()
    @IsString()
    level: string

    @IsNotEmpty()
    @IsNumber()
    duration: number

    @IsNotEmpty()
    @IsNumber()
    totalSession: number

    @IsNotEmpty()
    @IsNumber()
    courseFee: number
}

export class CoursesDTO{
    // @IsEnum(TrangThaiKH)
    @IsOptional()
    status?: TrangThaiKH

    @IsString()
    @IsOptional()
    q?:string //câu truy vấn
}

export class UpdateCourseDTO{
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name: string

    @IsOptional()
    @IsString()
    level: string

    @IsOptional()
    @IsNumber()
    duration: number

    @IsOptional()
    @IsNumber()
    totalSession: number

    @IsOptional()
    @IsNumber()
    courseFee: number

    @IsOptional()
    @IsString()
    description: string
}