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

    async validate(payload: { sub: number, email: string, role: string, tokenVersion: number }) {
        const userDB = await this.prismaService.user.findUnique({
            where: { ID: payload.sub }
        })
        if (!userDB) throw new UnauthorizedException('Chưa đăng nhập, không thể truy cập')
        if (userDB.ToKenVerSion !== payload.tokenVersion)
            throw new UnauthorizedException('Token đã hết hạn hoặc đã hủy')
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}

/**
 * Client gửi request có token, token tạo từ payload khi đăng nhập
 * token được gắn vào header
 * 
 * AuthGuard('jwt') (JwtAuthGuard): lấy token từ header gửi cho JwtStrategy
 * 
 * JwtStrategy validate token: lấy token từ header, verify token = JWT_SECRET,
 * và decode token thành payload và gọi validate(payload)
 * 
 * validate(payload): không lỗi -> cho qua, lỗi -> chặn
 * 
 * gắn user vào request: giá trị return của validate sẽ là giá trị của user 
 * trong request
 * vd: return {            
 * userId: payload.sub,
 * role: payload.role
 * };
 * 
 * req.user = {
  userId: 12,
  role: "ADMIN"
}
 */









