import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { SessionService } from "./session.service";
import { CreateSessionDTO, UpdateSessionDTO } from "./session.dto";
import { Request } from 'express';
import { MustChangePWGuard } from "src/auth/guard/must-change-pw.guard";
import { RequestUnlock, SessionsResultDTO } from "../session-result/session-result.dto";
type RequestWithUser = Request & { user: { userId: number; role?: string } };

@Controller()
export class SessionController {
    constructor(private sessionService: SessionService) { }

    // tạo buổi học tự động
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions-auto/classes/:id')
    async AutoGenerateSession(@Param('id') classId: number) {
        return await this.sessionService.AutoGenerateSession(+classId)
    }

    //tạo buổi học thủ công
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions-manual/classes/:id')
    async ManualGenerateSession(
        @Body() body: CreateSessionDTO,
        @Param('id') classId: number) {
        return await this.sessionService.ManualGenerateSession(+classId, body)
    }

    //sửa buổi học: chủ đề + phòng học
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Patch('teacher/sessions/:id')
    async UpdateSessionById(
        @Param('id') sessionId: number,
        @Body() body: UpdateSessionDTO,
        @Req() req: RequestWithUser) {
        const user = req.user
        const teacherId = user.role === 'ADMIN' ? null : user.userId
        return await this.sessionService.UpdateSessionById(teacherId, +sessionId, body)
    }

    // hủy buổi học: 
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch('admin/sessions/:id/cancel')
    async CancellSessionById(@Param('id') sessionId: number,
        @Body('reason') reason: string) {
        return await this.sessionService.CancelSessionById(+sessionId, reason)
    }

    // thông tin buổi học
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @Get('teacher/sessions/:id')
    async GetSession(@Param('id') sessionId: number) {
        return await this.sessionService.GetSession(+sessionId)
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
    @Roles('ADMIN', 'TEACHER')
    @Put('teacher/sessions/:id/result-submit')
    async SubmittedResult(
        @Param('id') sessionId: number,
        @Body() body: SessionsResultDTO,
        @Req() req: RequestWithUser) {
        const userId = req.user.role === 'ADMIN' ? null : req.user.userId
        if (!userId) throw new NotFoundException('Teacher not found')
        return await this.sessionService.SubmittedResult(+userId, +sessionId, body)
    }

    // mở khóa lưu kết quả buổi học
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('admin/sessions/:id/unlock')
    async UnlockSession(@Param('id') sessionId: number) {
        return await this.sessionService.UnlockSession(+sessionId)
    }

    // gửi yêu cầu mở khóa buổi học 
    @UseGuards(JwtAuthGuard, MustChangePWGuard, RolesGuard)
    @Roles('TEACHER')
    @Post('sessions/:id/request-unlock')
    async RequestUnlock(
        @Req() req: RequestWithUser,
        @Param('id') sessionId: number,
        @Body() reason: RequestUnlock) {
        const userId = req.user.userId
        return await this.sessionService.RequestUnlock(+userId, +sessionId, reason.reason)
    }
}