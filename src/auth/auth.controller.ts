import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDTO, LoginDTO, RegisterDTO } from './auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { type Request} from 'express'

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post("register")
    register(@Body() registerDTO: RegisterDTO) {
        return this.authService.Register(registerDTO);
    }

    @Post("login")
    login(@Body() loginDTO: LoginDTO) {
        return this.authService.Login(loginDTO);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("password")
    changePassWord(@Req() req: Request, @Body() changePW: ChangePasswordDTO) {
        return this.authService.ChangePassword(
            Number(req.user.userId), changePW.oldPassword, changePW.newPassword)
    }
}
