import { Type } from "class-transformer"
import { IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsPositive, IsString, Min } from "class-validator"
import { TrangThaiHV } from "src/generated/prisma/enums"

export class CreateStudentDTO {
    @IsNotEmpty()
    @IsString()
    code: string

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    classId: number

    @IsNotEmpty()
    @IsString()
    student: string

    @IsNotEmpty()
    @IsString()
    parent: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    dob: Date

    @IsOptional()
    @IsString()
    address?: string

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    fee: number
}

export class QueryStudentDTO {
    @IsOptional()
    @IsEnum(TrangThaiHV)
    status?: TrangThaiHV

    @IsOptional()
    q?: string
}

export class UpdateStudentDTO {
    @IsOptional()
    @IsString()
    student?: string

    @IsOptional()
    @IsString()
    parent?: string

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dob = Date

    @IsOptional()
    @IsString()
    address?: string

    @IsOptional()
    @IsString()
    note?: string
}