import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDTO, ProfileDTO, RegisterDTO } from './auth.dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ) { }

    // Đăng ký 
    async Register(registerDTO: RegisterDTO) {
        // 1 kiểm tra trùng mail và số điện thoại
        const userDB = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { Email: registerDTO.email },
                    { DienThoai: registerDTO.phone },
                ]
            }
        })

        if (userDB) throw new BadRequestException('Email or phone number is used')

        // 2 băm mật khẩu là số điện thoại
        const passwordHash = await bcrypt.hash(registerDTO.phone, 10)

        // 3 lưu user vào DB
        return await this.prismaService.user.create({
            data: {
                Email: registerDTO.email,
                DienThoai: registerDTO.phone,
                MatKhauHash: passwordHash,
                VaiTro: registerDTO.role,
                CreatedAt: undefined
            },
            // hiện ra những trường nào
            select: {
                ID: true,
                Email: true,
                DienThoai: true,
                VaiTro: true,
            }
        })

    }

    // Xác thực
    async ValidateUser(loginDTO: LoginDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { Email: loginDTO.email }
        })
        if (!userDB)
            throw new UnauthorizedException("User is not exist!")

        const ok = await bcrypt.compare(loginDTO.password, userDB.MatKhauHash)
        if (!ok)
            throw new UnauthorizedException("Incorrect password!")

        return userDB
    }

    // Đăng nhập
    async Login(loginDTO: LoginDTO) {
        // check user
        const userDB = await this.ValidateUser(loginDTO)
        const payload = {
            sub: userDB.ID,
            role: userDB.VaiTro,
            mustChangePW: userDB.PhaiDoiMK,
            tokenVersion: userDB.ToKenVerSion
        }

        const token = await this.jwtService.signAsync(payload)
        return {
            acccessToken: token,
            role: userDB.VaiTro
        }
    }

    // đăng xuất: tăng token version lên 1
    async Logout(userId: number) {
        await this.prismaService.user.update({
            where: { ID: userId }, data: { ToKenVerSion: { increment: 1 } }
        })
        return { msg: "Logout succesfully" }
    }

    async GetMe(userId: number) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userId },
            select: {
                ID: true, HoTen: true, Email: true,
                DienThoai: true, VaiTro: true,PhaiDoiMK: true
            }
        })
        if (!userDB)
            throw new UnauthorizedException("User is not exist")
        return userDB
    }

    // đổi tên + mật khẩu
    async UpdateProfile(userID: number, profile: ProfileDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userID }
        })
        if (!userDB)
            throw new NotFoundException("User not found")

        const data: Prisma.UserUpdateInput = {}
        if (profile.userName)
            data.HoTen = profile.userName.trim()

        if (profile.newPassword && profile.oldPassword) {
            const comparePW = await bcrypt.compare(profile.oldPassword, userDB.MatKhauHash)
            if (!comparePW)
                throw new UnauthorizedException("Incorrect password!")

            if (profile.oldPassword === profile.newPassword)
                throw new BadRequestException("Password doesn't change!")

            const hashPW = await bcrypt.hash(profile.newPassword, 10)
            data.MatKhauHash = hashPW
            data.PhaiDoiMK = false
            data.ToKenVerSion = { increment: 1 }
        }

        await this.prismaService.user.update({
            where: { ID: userID }, data
        })
        return { mgs: "Update succesfully" }
    }
}