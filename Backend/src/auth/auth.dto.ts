import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Vaitro } from 'src/generated/prisma/enums';

export class RegisterDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsPhoneNumber('VN') //SĐT VN
  @IsNotEmpty()
  phone!: string;

  @IsEnum(Vaitro, {
    message: `User có vai trò là ${Object.values(Vaitro).join(',')}`,
  })
  @IsNotEmpty()
  role!: Vaitro;
}

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  mustChangePW?: boolean;
}

export class ProfileDTO {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  newPassword!: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsPhoneNumber('VN') //SĐT VN
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  address?: string;
}

export class ForgotPwDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  mobileUrl?: string;
}

export class ResetPwDto {
  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  token!: string;
}
