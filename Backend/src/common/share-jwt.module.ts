import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [
        JwtModule.registerAsync({// dùng async vì dùng register thì configService chưa load
            inject: [ConfigService],// file .env đã đưa cho JwtModule ký jwt
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: "4h" }
            })
        })
    ],
    exports: [JwtModule]
})
export class SharedJWTModule { }