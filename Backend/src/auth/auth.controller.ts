import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO, ProfileDTO, RegisterDTO } from './auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Request } from 'express';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './decorators/roles.decorator';

type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    // đăng ký
    // @Post("register")
    // async Register(@Body() registerDTO: RegisterDTO) {
    //     return await this.authService.Register(registerDTO);
    // }

    // đăng nhập
    @Post("login")
    async Login(@Body() loginDTO: LoginDTO) {
        return await this.authService.Login(loginDTO);
    }

    // đăng xuất
    @UseGuards(JwtAuthGuard)
    @Post("logout")
    async Loout(@Req() req: RequestWithUser) {
        return await this.authService.Logout(req.user.userId);
    }

    // lấy thông tin tài khoản
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN', 'TEACHER', 'PARENT')
	@Get('me')
	async GetMe(@Req() request: RequestWithUser) {
		return await this.authService.GetMe(+request.user.userId)
	}

	// đổi thông tin tài khoản
	@UseGuards(JwtAuthGuard)
	@Patch("profile")
	async UpdateProfile(
		@Req() req: RequestWithUser, @Body() profile: ProfileDTO) {
		const userId = req.user.userId
        return await this.authService.UpdateProfile(+userId, profile)
	}
}