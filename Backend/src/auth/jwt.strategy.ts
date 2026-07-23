import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService
    ) {
        super({
            //lấy token từ header
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, //hết hạn là bị chặn
            secretOrKey: configService.get('JWT_ACCESS_SECRET') || configService.get('JWT_SECRET')
        })
    }

    async validate(payload: { sub: number, email: string, role: string, tokenVersion: number }) {
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









