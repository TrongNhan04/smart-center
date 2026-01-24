import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class ProfileDTO{
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    userName?: string

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    oldPassword: string

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    newPassword: string
}