import { Controller, Get, UseGuards, Req, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express'
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ProfileDTO } from './user.dto';
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  @Get('me')
  GetMe(@Req() request: RequestWithUser) {
    return this.userService.GetMe(+request.user.userId)
  }

  // đổi mật khẩu + tên
  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  async UpdateProfile(
    @Req() req: RequestWithUser, @Body() profile: ProfileDTO) {
    return await this.userService.UpdateProfile(
      +req.user.userId, profile)
  }
}
