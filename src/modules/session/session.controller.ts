import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";
import { CreateSessionDTO } from "./session.dto";

@Controller('admin/sessions')
export class SessionController {
    constructor(private sessionService: SessionService) { }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id')
    async ManualGenerateSession(@Param('id') classId: number,
        @Body() body: CreateSessionDTO) {
            return await this.sessionService.ManualGenerateSession(+classId, body)
    }

    //sửa buổi học: chủ đề
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async UpdateSessionById(@Param('id') sessionId: number,
        @Body('topic') topic: string) {
        return await this.sessionService.UpdateSessionById(+sessionId, topic)
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