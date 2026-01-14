import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";
import { CreateSessionDTO, SessionsResultDTO } from "./session.dto";
import { Request } from 'express';
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller()
export class SessionController {
    constructor(private sessionService: SessionService) { }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions')
    async ManualGenerateSession(@Body() body: CreateSessionDTO) {
        return await this.sessionService.ManualGenerateSession(body)
    }

    //sửa buổi học: chủ đề
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Patch('teacher/sessions/:id')
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
    @Patch('admin/sessions/:id/cancel')
    async CancellSessionById(@Param('id') sessionId: number,
        @Body('reason') reason: string) {
        return await this.sessionService.CancelSessionById(+sessionId, reason)
    }

    // thông tin buổi học + danh sách học viên ghi danh ACTIVE
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teacher/sessions/:id/operation')
    async GetSession_Enrolls(
        @Param('id') sessionId: number,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.GetSession_Enrolls(+userId, +sessionId)
    }

    // lưu nháp kết quả buổi học - DRAFT
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Put('teacher/sessions/:id/result-draft')
    async SaveDraftResult(
        @Param('id') sessionId: number,
        @Body() body: SessionsResultDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.SaveDraftResult(+userId, +sessionId, body)
    }

    // lưu thật kết quả buổi học - SUBMITTED
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN','TEACHER')
    @Put('teacher/sessions/:id/result-submit')
    async SubmittedResult(
        @Param('id') sessionId: number,
        @Body() body: SessionsResultDTO,
        @Req() req: RequestWithUser){
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if(!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.SubmittedResult(+userId, +sessionId, body)
    }
}