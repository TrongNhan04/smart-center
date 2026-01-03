import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        public prismaService: PrismaService
    ) {
        super({
            //lấy token từ header
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, //hết hạn là bị chặn
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate(payload: { sub: string, email: string, role: string }) {
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}