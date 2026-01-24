import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [PrismaModule, ConfigModule.forRoot({isGlobal:true}), 
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {expiresIn: "30m"}
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports:[AuthModule]
})
export class AuthModule { }
