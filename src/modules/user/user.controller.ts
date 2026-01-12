import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import {Request} from 'express'
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','TEACHER','PARENT')
  @Get('me')
  GetProfile(@Req() request: RequestWithUser){
    return this.userService.Profile(request.user.userId)
  }
}
