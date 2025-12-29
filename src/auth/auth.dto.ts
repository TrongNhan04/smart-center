import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPhoneNumber, IsString } from "class-validator"
import { Vaitro } from "src/generated/prisma/enums"

export class RegisterDTO{
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsPhoneNumber('VN')//SĐT VN
    @IsNotEmpty()
    phone: string

    // @IsNotEmpty()
    // password: string

    @IsEnum(Vaitro,{message:`User có vai trò là ${Object.values(Vaitro).join(",")}`})
    @IsNotEmpty()
    role: Vaitro
}

export class LoginDTO{
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    @IsString()
    password: string
}


export class ChangePasswordDTO{
    @IsNotEmpty()
    @IsString()
    oldPassword: string

    @IsNotEmpty()
    @IsString()
    newPassword: string
}