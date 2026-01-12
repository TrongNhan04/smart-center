import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDTO, LoginDTO, RegisterDTO } from './auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Request } from 'express';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    // đăng ký
    @Post("register")
    async Register(@Body() registerDTO: RegisterDTO) {
        return await this.authService.Register(registerDTO);
    }

    // đăng nhập
    @Post("login")
    async Login(@Body() loginDTO: LoginDTO) {
        return await this.authService.Login(loginDTO);
    }

    // đổi mật khẩu
    @UseGuards(JwtAuthGuard)
    @Patch("password")
    async ChangePassWord(@Req() req: RequestWithUser, @Body() changePW: ChangePasswordDTO) {
        return await this.authService.ChangePassword(
            Number(req.user.userId), changePW.oldPassword, changePW.newPassword)
    }

    // đăng xuất
    @UseGuards(JwtAuthGuard)
    @Post("logout")
    async Loout(@Req() req: RequestWithUser) {
        return this.authService.Logout(req.user.userId);
    }
}