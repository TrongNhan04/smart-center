import { Type } from "class-transformer"
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator"
import { TrangThaiGV } from "src/generated/prisma/enums"

export class CreateTeacherDTO {
    @IsNotEmpty()
    @IsString()
    code!: string // thêm dấu ! để nói với ts là code sẽ có dữ liệu sau

    @IsNotEmpty()
    @IsString()
    name!: string

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    dob!: Date 

    @IsNotEmpty()
    @IsEmail()
    email!: string

    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone!: string

    @IsOptional()
    @IsString()
    major?: string

    @IsOptional()
    @IsString()
    address?: string
}

export class QueryTeacherDTO {
    @IsOptional()
    @IsEnum(TrangThaiGV)
    status?: TrangThaiGV

    @IsOptional()
    q?: string
}

export class UpdateTeacherDTO {    
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dob?: Date 
    
    @IsOptional()
    @IsString()
    address?: string

    @IsOptional()
    @IsString()
    major?: string
}