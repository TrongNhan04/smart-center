import { Body, Controller, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";
import { CreateSessionDTO } from "./session.dto";
import { Request } from 'express';
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller('admin/sessions')
export class SessionController {
    constructor(private sessionService: SessionService) { }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async ManualGenerateSession(@Body() body: CreateSessionDTO) {
        return await this.sessionService.ManualGenerateSession(body)
    }

    //sửa buổi học: chủ đề
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Patch(':id')
    async UpdateSessionById(
        @Param('id') sessionId: number,
        @Body('topic') topic: string,
        @Res() req: RequestWithUser) {
        const user = req.user
        const teacherId = user.role === 'ADMIN' ? null : user.userId
        return await this.sessionService.UpdateSessionById(teacherId, +sessionId, topic)
    }

    // hủy buổi học: 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/cancel')
    async CancellSessionById(@Param('id') sessionId: number,
        @Body('reason') reason: string) {
        return await this.sessionService.CancelSessionById(+sessionId, reason)
    }
}