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

    @Post("register")
    async Register(@Body() registerDTO: RegisterDTO) {
        return this.authService.Register(registerDTO);
    }

    @Post("login")
    async Login(@Body() loginDTO: LoginDTO) {
        return this.authService.Login(loginDTO);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("password")
    async ChangePassWord(@Req() req: RequestWithUser, @Body() changePW: ChangePasswordDTO) {
        return this.authService.ChangePassword(
            Number(req.user.userId), changePW.oldPassword, changePW.newPassword)
    }
}
