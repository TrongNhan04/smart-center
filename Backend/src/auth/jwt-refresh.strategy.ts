import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        configService: ConfigService,
        public prismaService: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'), // We can extract from body since it's easier for mobile apps, or from AuthHeader
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_REFRESH_SECRET') || configService.get('JWT_SECRET')
        })
    }

    async validate(payload: { sub: number, email: string, role: string, tokenVersion: number }) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: payload.sub }
        })
        if (!userDB) throw new UnauthorizedException('Chưa đăng nhập, không thể truy cập')
        if (userDB.PhienBanToken !== payload.tokenVersion)
            throw new UnauthorizedException('Token hết hạn hoặc đã hủy')
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
