import { Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { Request } from "express";
import { NotifyService } from "./notify.service";
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotifyController {
    constructor(private notifyService: NotifyService) { }

    @Get()
    async GetMyNotis(
        @Req() req: RequestWithUser,
        @Query('page') page: number) {
        return await this.notifyService.GetMyNotification(+req.user.userId, page)
    }

    @Patch('/:id')
    async ReadOne(@Req() req: RequestWithUser, @Param('id') notifyId: number) {
        return await this.notifyService.MaskAsRead(+req.user.userId, +notifyId)
    }

    @Patch()
    async ReadAll(@Req() req: RequestWithUser) {
        return await this.notifyService.MaskAllRead(+req.user.userId)
    }
}