import { BadRequestException, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "src/prisma/prisma.service"
import nodemailer, { Transporter } from 'nodemailer'
import Mail from "nodemailer/lib/mailer"

@Injectable()
export class EmailService {
    private transporter: Transporter

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly prismaSv: PrismaService,
    ) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: configService.get<string>('EMAIL_USER'),
                pass: configService.get<string>('EMAIL_PASSWORD')
            }
        })
    }

    // WEB: gửi link reset password + token qua email
    async sendResetPasswordLink(email: string, mobileUrl?: string) {
        const user = await this.prismaSv.user.findUnique({
            where: { Email: email }
        })
        if (!user) return

        const payload = { email, tokenVersion: user.PhienBanToken }
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: '15m' // hết hạn sau 15 phút
        })
        // EMAIL_RESET_PASSWORD_URL là url của frontend
        // nếu là mobile thì lấy mobile
        const webURL = this.configService.get('EMAIL_RESET_PASSWORD_URL')
        const url = `${mobileUrl?mobileUrl:webURL}?token=${token}`

        const text = `Xin chào, \nĐể thay đổi mật khẩu của bạn, hãy click vào đường dẫn: ${url}`

        return this.sendMail({
            to: email,
            subject: 'Reset password',
            text
        })
    }

    // APP: gửi OTP reset password + token qua email
    async sendResetPasswordOTP(email: string) {
        const user = await this.prismaSv.user.findFirst({
            where: { Email: email }
        })
        if (!user) return


    }

    async decodeConfirmationToken(token: string) {
        try { // payload chứa email dòng 30
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET')
            })
            if (typeof payload === 'object' && 'email' in payload)
                return payload
            throw new BadRequestException()
        } catch (error) {
            throw new BadRequestException('Token xác thực thất bại');
        }
    }

    private sendMail(options: Mail.Options) {
        console.log('Email sent out to', options.to);
        return this.transporter.sendMail(options);
    }
}