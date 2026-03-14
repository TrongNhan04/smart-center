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

        if (userDB) throw new BadRequestException('Email hoặc số điện thoại đã được sử dụng')

        // 2 băm mật khẩu là số điện thoại
        const passwordHash = await bcrypt.hash(registerDTO.phone, 15)

        // 3 lưu user vào DB
        return await this.prismaService.user.create({
            data: {
                Email: registerDTO.email,
                DienThoai: registerDTO.phone,
                MatKhauHash: passwordHash,
                VaiTro: registerDTO.role,
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
            throw new UnauthorizedException("Không tìm thấy người dùng!")

        const ok = await bcrypt.compare(loginDTO.password, userDB.MatKhauHash)
        if (!ok)
            throw new UnauthorizedException("Sai mật khẩu")
        return userDB
    }

    // Đăng nhập
    async Login(loginDTO: LoginDTO) {
        // check user
        const userDB = await this.ValidateUser(loginDTO)
        const payload = {
            sub: userDB.ID,
            role: userDB.VaiTro,
            email: userDB.Email,
            // mustChangePW: userDB.PhaiDoiMK,
            tokenVersion: userDB.ToKenVerSion
        }
        const classes = await this.prismaService.lopHoc.findMany({
            where: { giaovien: { UserID: userDB.ID } },
            select: { ID: true }
        })

        const token = await this.jwtService.signAsync(payload)
        return {
           access_token: token,
            user: {
                id: userDB.ID,
                email: userDB.Email,
                full_name: userDB.HoTen,
                phone: userDB.DienThoai,
                role: userDB.VaiTro,
                classes: classes.map(item=>item.ID)
            }
        }
    }

    // đăng xuất: tăng token version lên 1
    async Logout(userId: number) {
        await this.prismaService.user.update({
            where: { ID: userId },
            data: { ToKenVerSion: { increment: 1 } }
        })
        return "Logout succesfully"
    }

    async GetMe(userId: number) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userId },
            select: {
                ID: true, HoTen: true, Email: true,
                DienThoai: true, VaiTro: true, PhaiDoiMK: true
            }
        })
        if (!userDB)
            throw new UnauthorizedException("User is not exist")
        return userDB
    }

    // cập nhật thông tin tài khoản
    async UpdateProfile(userID: number, profile: ProfileDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userID }
        })
        if (!userDB)
            throw new NotFoundException("không tìm thấy User")

        const data: Prisma.UserUpdateInput = {}
        if (profile.email || profile.phone) {
            const otherUser = await this.prismaService.user.findFirst({
                where: {
                    ID: { not: userID },
                    OR: [
                        { Email: profile.email },
                        { DienThoai: profile.phone }
                    ]
                }
            })
            if (otherUser)
                throw new ConflictException('Email hoặc điện thoại đã được sử dụng')
            data.Email = profile.email
            data.DienThoai = profile.phone
            if (profile.email)
                data.ToKenVerSion = { increment: 1 }// xóa token cũ
        }

        data.HoTen = profile.full_name ?? userDB.HoTen

        if (profile.newPassword && profile.oldPassword) {
            const comparePW = await bcrypt.compare(profile.oldPassword, userDB.MatKhauHash)
            if (!comparePW)
                throw new UnauthorizedException("Sai mật khẩu!")

            if (profile.oldPassword === profile.newPassword)
                throw new BadRequestException("Mật khẩu không thay đổi!")

            const hashPW = await bcrypt.hash(profile.newPassword, 15)
            data.MatKhauHash = hashPW
            data.PhaiDoiMK = false
            data.ToKenVerSion = { increment: 1 }// xóa token cũ
        }

        const update = await this.prismaService.user.update({
            where: { ID: userID }, data
        })
        return {
            id: update.ID,
            email: update.Email,
            full_name: update.HoTen,
            phone: update.DienThoai,
            role: update.VaiTro
        }
    }
}