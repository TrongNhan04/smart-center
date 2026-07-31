import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPwDto,
  LoginDTO,
  ProfileDTO,
  RegisterDTO,
  ResetPwDto,
} from './auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import express from 'express';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './decorators/roles.decorator';

type RequestWithUser = express.Request & {
  user: { userId: number; email: string; role?: string };
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // đăng ký
  @Post('register')
  async Register(@Body() registerDTO: RegisterDTO) {
    return await this.authService.register(registerDTO);
  }

  // đăng nhập
  @Post('login')
  async login(@Body() loginDTO: LoginDTO) {
    return await this.authService.login(loginDTO);
  }

  // đăng xuất
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: RequestWithUser) {
    return await this.authService.logout(req.user.userId);
  }

  // làm mới token
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshToken(
    @Req()
    req: express.Request & {
      user: {
        userId: number;
        email: string;
        role: string;
        tokenVersion: number;
      };
    },
  ) {
    return await this.authService.refreshTokens(req.user);
  }

  // lấy thông tin tài khoản
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('me')
  async getMe(@Req() request: RequestWithUser) {
    return await this.authService.getMe(+request.user.userId);
  }

  // đổi thông tin tài khoản
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() profile: ProfileDTO,
  ) {
    const userId = req.user.userId;
    return await this.authService.updateProfile(+userId, profile);
  }

  //quên mật khẩu
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPwDto) {
    return await this.authService.forgotPassword(body);
  }

  // đặt lại mật khẩu
  @Post('reset-password')
  async resetPassword(@Body() { token, password }: ResetPwDto) {
    return await this.authService.resetPassword(token, password);
  }

  // nhảy về app
  @Get('redict-to-app')
  openMobileApp(@Query('token') token: string, @Res() res: express.Response) {
    // nhớ đổi ip
    const expoLink = `exp://172.20.10.2:8081/--/(auth)/reset-password?token=${token}`;
    return res.redirect(expoLink);
  }
}
