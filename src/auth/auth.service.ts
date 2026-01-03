import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDTO, RegisterDTO } from './auth.dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }

    // Đăng ký 
    async Register(registerDTO: RegisterDTO) {
        // 1 kiểm tra trùng mail
        const userDB = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { Email: registerDTO.email },
                    { DienThoai: registerDTO.phone },
                ]
            }
        })

        if (userDB) {
            throw new HttpException({
                msg: `Số điện thoại ${registerDTO.phone} hoặc ${registerDTO.email} đã được sử dụng`
            }, HttpStatus.BAD_REQUEST)
        }

        // 2 băm mật khẩu là số điện thoại
        const passwordHash = await bcrypt.hash(registerDTO.phone, 10)

        // 3 lưu user vào DB
        const user = await this.prismaService.user.create({
            data: {
                Email: registerDTO.email,
                DienThoai: registerDTO.phone,
                MatKhauHash: passwordHash,
                VaiTro: registerDTO.role
            },
            // hiện ra những trường nào
            select: {
                ID: true,
                Email: true,
                DienThoai: true,
                VaiTro: true
            }
        })
        return {msg: "Successful"}
    }

    // Xác thực
    async ValidateUser(loginDTO: LoginDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { Email: loginDTO.email },
        })
        if (!userDB)
            throw new UnauthorizedException("User is not exist!")

        const ok = await bcrypt.compare(loginDTO.password, userDB.MatKhauHash)
        if (!ok)
            throw new UnauthorizedException("Incorrect password!")

        return {
            id: userDB.ID,
            email: userDB.Email,
            phone: userDB.DienThoai,
            mustChangePassword: userDB.PhaiDoiMK,
            role: userDB.VaiTro
        }
    }

    // Đăng nhập
    async Login(loginDTO: LoginDTO) {
        // check user
        const userDB = await this.ValidateUser(loginDTO)
        const payload = {
            sub: userDB.id,
            role: userDB.role,
            mustChangePW: userDB.mustChangePassword
        }

        const token = await this.jwtService.signAsync(payload)
        return {
            acccessToken: token,
            userDB
        }
    }

    //Đổi mật khẩu đăng nhập
    async ChangePassword(userID: number, oldpw: string, newpw: string) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userID },
            select: {
                ID: true,
                MatKhauHash: true
            }
        })
        if (!userDB)
            throw new UnauthorizedException("User is not exist!")

        const pw = await bcrypt.compare(oldpw, userDB.MatKhauHash)
        if (!pw)
            throw new UnauthorizedException("Incorrect password!")

        if (oldpw === newpw)
            throw new BadRequestException("Password doesn't change!")

        const hashPW = await bcrypt.hash(newpw, 10)

        await this.prismaService.user.update({
            where: { ID: userID },
            data: {
                MatKhauHash: hashPW,
                PhaiDoiMK: false
            }
        })
        return { mgs: "Password has changed!" }
    }

}
