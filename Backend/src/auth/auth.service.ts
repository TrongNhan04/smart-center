import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPwDto, LoginDTO, ProfileDTO, RegisterDTO } from './auth.dto';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'src/generated/prisma/client';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService
    ) { }

    // Đăng ký 
    async register(registerDTO: RegisterDTO) {
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
    async userValidate(loginDTO: LoginDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { Email: loginDTO.email }
        })
        if (!userDB)
            throw new UnauthorizedException("Không tìm thấy người dùng!")

        const correctPassword = await bcrypt.compare(loginDTO.password, userDB.MatKhauHash)
        if (!correctPassword)
            throw new UnauthorizedException("Sai mật khẩu")
        return userDB
    }

    // Đăng nhập
    async login(loginDTO: LoginDTO) {
        // check user
        const userDB = await this.userValidate(loginDTO)
        const payload = {
            sub: userDB.ID,
            role: userDB.VaiTro,
            email: userDB.Email,
            // mustChangePW: userDB.PhaiDoiMK,
            tokenVersion: userDB.PhienBanToken
        }

        // tìm lớp giáo viên dạy
        const classes = await this.prismaService.lopHoc.findMany({
            where: { giaovien: { UserID: userDB.ID } },
            select: { ID: true }
        })

        // tìm con của user
        const children = await this.prismaService.hocVien.findMany({
            where: { Parent: { ID: userDB.ID } },
            select: { ID: true }
        })

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET') || this.configService.get<string>('JWT_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
            })
        ]);

        return {
            access_token,
            refresh_token,
            user: {
                id: userDB.ID,
                email: userDB.Email,
                full_name: userDB.HoTen,
                phone: userDB.DienThoai,
                role: userDB.VaiTro,
                classes: classes.map(item => item.ID),
                children: children.map(child => child.ID)
            }
        }
    }

    // Refresh token
    async refreshTokens(user: { userId: number, email: string, role: string, tokenVersion: number }) {
        const payload = {
            sub: user.userId,
            role: user.role,
            email: user.email,
            tokenVersion: user.tokenVersion
        }

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET') || this.configService.get<string>('JWT_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d') as any,
            })
        ]);

        return {
            access_token,
            refresh_token
        }
    }

    // đăng xuất: tăng token version lên 1
    async logout(userId: number) {
        await this.prismaService.user.update({
            where: { ID: userId },
            data: { PhienBanToken: { increment: 1 } }
        })
        return "Logout succesfully"
    }

    // thông tin tài khoản
    async getMe(userId: number) {
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
    async updateProfile(userID: number, profile: ProfileDTO) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: userID }
        })
        if (!userDB) throw new NotFoundException("không tìm thấy User")

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
                data.PhienBanToken = { increment: 1 }// xóa token cũ
        }

        data.HoTen = profile.full_name ?? userDB.HoTen

        if (profile.newPassword && profile.oldPassword) {
            const comparePW = await bcrypt.compare(profile.oldPassword, userDB.MatKhauHash)
            if (!comparePW)
                throw new BadRequestException("Mật khẩu hiện tại không đúng!")

            if (profile.oldPassword === profile.newPassword)
                throw new BadRequestException("Mật khẩu không thay đổi!")

            const hashPW = await bcrypt.hash(profile.newPassword, 15)
            data.MatKhauHash = hashPW
            data.PhaiDoiMK = false
            data.PhienBanToken = { increment: 1 }// xóa token cũ
        }

        const [update, classes] = await Promise.all([
            this.prismaService.user.update({
                where: { ID: userID }, data
            }),
            this.prismaService.lopHoc.findMany({
                where: { giaovien: { UserID: userDB.ID } },
                select: { ID: true }
            })
        ])

        return {
            id: update.ID,
            email: update.Email,
            full_name: update.HoTen,
            phone: update.DienThoai,
            role: update.VaiTro,
            must_change_pw: userDB.PhaiDoiMK,
            classes: classes.map(item => item.ID),
        }
    }

    // WEB: gửi email có link để đặt lại mật khẩu
    async forgotPassword(body: ForgotPwDto) {
        const user = await this.prismaService.user.findFirst({
            where: { Email: body.email }
        })
        if (!user) return
        await this.emailService.sendResetPasswordLink(user.Email, body.mobileUrl)
    }

    // APP: 
    async appForgotPassword(email: string) {
        const user = await this.prismaService.user.findFirst({
            where: { Email: email }
        })
        if (!user) return

    }

    // reset mật khẩu
    async resetPassword(token: string, password: string) {
        const { email, tokenVersion } =
            await this.emailService.decodeConfirmationToken(token)

        const user = await this.prismaService.user.findUnique({
            where: { Email: email }
        })
        if (!user) return
        if (tokenVersion !== user.PhienBanToken)
            throw new BadRequestException('Token hết hiệu lực')

        const newPw = await bcrypt.hash(password, 15)
        await this.prismaService.user.update({
            where: { Email: email },
            data: {
                MatKhauHash: newPw,
                PhienBanToken: { increment: 1 }
            }
        })
        return 'Đổi mật khẩu thành công'
    }
}