import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { SharedJWTModule } from 'src/common/share-jwt.module';
import { EmailModule } from 'src/email/email.module';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

@Module({
  imports: [PrismaModule, PassportModule, SharedJWTModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
