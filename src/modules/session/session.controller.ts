import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";

@Controller('admin/sessions')
export class SessionController {
    constructor(private sessionService: SessionService) { }

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
        return await this.sessionService.CancellSessionById(+sessionId, reason)
    }
}