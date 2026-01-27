import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator"
import { TrangThaiGV } from "src/generated/prisma/enums"

export class CreateTeacherDTO{
    @IsNotEmpty()
    @IsString()
    code:string
    
    @IsNotEmpty()
    @IsString()
    name:string
    
    @IsNotEmpty()
    @IsEmail()
    email: string
    
    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string
    
    @IsOptional()
    @IsString()
    major?: string
}

export class QueryTeacherDTO{
    @IsOptional()
    @IsEnum(TrangThaiGV)
    status?: TrangThaiGV

    @IsOptional()
    q?:string
}

export class UpdateTeacherDTO{
    @IsOptional()
    @IsString()
    name?: string
    
    @IsOptional()
    @IsString()
    major?: string
    
    @IsOptional()
    @IsString()
    note?: string

    @IsOptional()
    @IsEnum(TrangThaiGV)
    status?: TrangThaiGV
}